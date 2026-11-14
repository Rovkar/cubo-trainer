(function (root) {
  'use strict';

  // Vista isometrica del cubo (puro, sin DOM). Las flechas se derivan de la
  // geometria del motor (Cube.moveInfo + Cube.stickerGeom), nunca por letra.
  var Cube = (typeof module !== 'undefined' && module.exports) ? require('./cube.js') : root.Cube;

  var DEG = Math.PI / 180;
  var DEFAULT_VIEW = { yaw: -35, pitch: 28 };
  var FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
  var NORMAL = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };
  var BODY = '#17181d';

  function viewOf(v) {
    return {
      yaw: v && v.yaw != null ? v.yaw : DEFAULT_VIEW.yaw,
      pitch: v && v.pitch != null ? v.pitch : DEFAULT_VIEW.pitch,
    };
  }

  // Giro en yaw (eje y) y luego en pitch (eje x). Pantalla: X = x1, Y = -y2; depth = z2.
  function project(p, view) {
    var v = viewOf(view), a = v.yaw * DEG, b = v.pitch * DEG;
    var x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a);
    var z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
    var y2 = p[1] * Math.cos(b) - z1 * Math.sin(b);
    var z2 = p[1] * Math.sin(b) + z1 * Math.cos(b);
    return { x: x1, y: -y2, depth: z2 };
  }

  function visibleFaces(view) {
    return FACES.filter(function (f) { return project(NORMAL[f], view).depth > 1e-9; });
  }

  function axisOf(n) { return n[0] !== 0 ? 0 : n[1] !== 0 ? 1 : 2; }
  function add(a, b, k) { return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function norm(a) {
    var l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  function num(x) { return String(Math.round(x * 1000) / 1000); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Centro del facelet sobre la superficie (el cubo mide 3: la capa p=+-1 esta a 1.5 del centro).
  function surface(g) { return add(g.p, g.n, 0.5); }

  // Puntos 2D (pantalla) -> [x, y]
  function scr(p3, view) { var q = project(p3, view); return [q.x, q.y]; }

  // Cuatro esquinas 3D del facelet, con holgura entre piezas.
  function stickerCorners(g, h) {
    var c = surface(g), ax = axisOf(g.n), u = [0, 0, 0], v = [0, 0, 0], k = 0, axes = [];
    for (k = 0; k < 3; k++) if (k !== ax) axes.push(k);
    u[axes[0]] = 1; v[axes[1]] = 1;
    return [add(add(c, u, -h), v, -h), add(add(c, u, h), v, -h), add(add(c, u, h), v, h), add(add(c, u, -h), v, h)];
  }

  // ---- Flechas derivadas del motor ----
  function arrows(token, view) {
    var info = Cube.moveInfo(token), ax = info.axis;
    var omega = [0, 0, 0];
    omega[ax] = info.dir; // velocidad angular: dir * eje (regla de la mano derecha)
    var out = [];
    visibleFaces(view).forEach(function (f) {
      var n = NORMAL[f], nAx = axisOf(n), moving = [], i, g;
      for (i = 0; i < 9; i++) {
        g = Cube.stickerGeom(f, i);
        g.i = i;
        if (info.layers.indexOf(g.p[ax]) >= 0) moving.push(g);
      }
      if (!moving.length) return;

      if (nAx === ax) {
        // La cara que gira es visible: flecha curva (~270 grados) alrededor del centro.
        var c3 = surface(Cube.stickerGeom(f, 4));
        var e1 = nAx === 1 ? [0, 0, 1] : [0, 1, 0];
        var e2 = cross(n, e1);               // e1 x e2 = n  (antihorario visto desde +n = theta creciente)
        var ccw = info.dir * n[ax] > 0;     // omega . n > 0
        var R = 0.95, N = 28, a0 = ccw ? 45 : 315, step = (ccw ? 270 : -270) / N;
        var pts = [], k, th;
        for (k = 0; k <= N; k++) {
          th = (a0 + step * k) * DEG;
          pts.push(scr(add(add(c3, e1, R * Math.cos(th)), e2, R * Math.sin(th)), view));
        }
        // orientacion en pantalla (SVG, y hacia abajo): suma de shoelace > 0 => horario
        var poly = [scr(c3, view)].concat(pts), sum = 0;
        for (k = 0; k < poly.length; k++) {
          var A = poly[k], B = poly[(k + 1) % poly.length];
          sum += A[0] * B[1] - B[0] * A[1];
        }
        out.push({ face: f, kind: 'arc', from: pts[0], to: pts[pts.length - 1], cw: sum > 0, pts: pts, turns: info.turns });
      } else {
        // Capas que cruzan la cara: una tira (3 facelets) por capa -> una flecha recta por tira.
        info.layers.forEach(function (L) {
          var strip = moving.filter(function (s) { return s.p[ax] === L; });
          if (strip.length !== 3) return;
          var mid = [0, 0, 0];
          strip.forEach(function (s) { mid = add(mid, surface(s), 1 / 3); });
          var t3 = norm(cross(omega, mid)); // tangente omega x p, ya contenida en el plano de la cara
          var p0 = scr(add(mid, t3, -1.2), view), p1 = scr(add(mid, t3, 1.2), view);
          out.push({
            face: f, kind: 'line', from: p0, to: p1, cw: undefined, pts: [p0, p1], turns: info.turns,
            dir3: t3, stickers: strip.map(function (s) { return s.i; }), // tangente 3D y facelets de la tira
          });
        });
      }
    });
    return out;
  }

  // ---- Dibujo SVG ----
  function headPath(tip, dir, len, half) {
    var bx = tip[0] - dir[0] * len, by = tip[1] - dir[1] * len;
    var nx = -dir[1], ny = dir[0];
    return 'M' + num(tip[0]) + ' ' + num(tip[1]) + 'L' + num(bx + nx * half) + ' ' + num(by + ny * half) +
      'L' + num(bx - nx * half) + ' ' + num(by - ny * half) + 'Z';
  }

  function arrowSvg(a) {
    var pts = a.pts.slice(), last = pts[pts.length - 1], prev = pts[pts.length - 2];
    var dx = last[0] - prev[0], dy = last[1] - prev[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
    var d = [dx / l, dy / l], hl = 0.42, hw = 0.21;
    // el cuerpo termina en la base de la cabeza
    pts[pts.length - 1] = [last[0] - d[0] * hl * 0.6, last[1] - d[1] * hl * 0.6];
    var path = 'M' + pts.map(function (p) { return num(p[0]) + ' ' + num(p[1]); }).join('L');
    var head = headPath(last, d, hl, hw);
    var s = '<g fill="none" stroke-linecap="round" stroke-linejoin="round" data-arrow="' + a.face + a.kind + '">' +
      '<path d="' + path + '" stroke="#fff" stroke-width="0.3" opacity="0.92"/>' +
      '<path d="' + head + '" stroke="#fff" stroke-width="0.17" fill="#fff" opacity="0.92"/>' +
      '<path d="' + path + '" stroke="#111" stroke-width="0.13"/>' +
      '<path d="' + head + '" fill="#111" stroke="#111" stroke-width="0.03"/>';
    if (a.turns === 2) {
      var m = pts[Math.floor(pts.length / 2)];
      s += '<circle cx="' + num(m[0]) + '" cy="' + num(m[1]) + '" r="0.3" fill="#fff" stroke="#111" stroke-width="0.07"/>' +
        '<text x="' + num(m[0]) + '" y="' + num(m[1] + 0.12) + '" text-anchor="middle" font-size="0.4" font-weight="800" fill="#111" stroke="none" font-family="system-ui,sans-serif">2</text>';
    }
    return s + '</g>';
  }

  function hull(points) {
    var p = points.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop();
      lo.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop();
      up.push(p[i]);
    }
    lo.pop(); up.pop();
    return lo.concat(up);
  }

  function svg(state, opts) {
    opts = opts || {};
    var view = viewOf(opts.view);
    var size = opts.size || 160;
    var faces = visibleFaces(view);
    var corners = [], sx, sy, sz;
    for (sx = -1; sx <= 1; sx += 2) for (sy = -1; sy <= 1; sy += 2) for (sz = -1; sz <= 1; sz += 2) {
      corners.push(scr([sx * 1.5, sy * 1.5, sz * 1.5], view));
    }
    var H = hull(corners);
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    H.forEach(function (p) {
      if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
    });
    var pad = 0.3, vw = maxX - minX + 2 * pad, vh = maxY - minY + 2 * pad;
    var w = size, h = Math.round(size * vh / vw);
    var hi = opts.highlight ? Cube.moveInfo(opts.highlight) : null;

    var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + num(minX - pad) + ' ' + num(minY - pad) + ' ' + num(vw) + ' ' + num(vh) +
      '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(opts.title || "Rubik's cube") + '" style="max-width:100%;height:auto">'];
    o.push('<path d="M' + H.map(function (p) { return num(p[0]) + ' ' + num(p[1]); }).join('L') + 'Z" fill="' + BODY + '" stroke="' + BODY + '" stroke-width="0.24" stroke-linejoin="round"/>');
    o.push('<g style="stroke:var(--stk);stroke-width:0.04;stroke-linejoin:round">');
    faces.forEach(function (f) {
      for (var i = 0; i < 9; i++) {
        var g = Cube.stickerGeom(f, i);
        var q = stickerCorners(g, 0.45).map(function (c) { return num(scr(c, view)[0]) + ' ' + num(scr(c, view)[1]); });
        var dim = hi && hi.layers.indexOf(g.p[hi.axis]) < 0;
        o.push('<path data-s="' + f + i + '" fill="' + Cube.COLORS[state[f][i]] + '"' + (dim ? ' opacity="0.5"' : '') + ' d="M' + q.join('L') + 'Z"/>');
      }
    });
    o.push('</g>');
    if (opts.labels) {
      faces.forEach(function (f) {
        var c = scr(surface(Cube.stickerGeom(f, 4)), view);
        o.push('<text x="' + num(c[0]) + '" y="' + num(c[1] + 0.3) + '" text-anchor="middle" font-size="0.9" font-weight="800" ' +
          'font-family="ui-monospace,Consolas,monospace" fill="#111" stroke="#fff" stroke-width="0.2" stroke-linejoin="round" paint-order="stroke">' + f + '</text>');
      });
    }
    if (opts.arrows) {
      arrows(opts.arrows, view).forEach(function (a) { o.push(arrowSvg(a)); });
    }
    o.push('</svg>');
    return o.join('');
  }

  var Cube3D = {
    DEFAULT_VIEW: DEFAULT_VIEW,
    project: project,
    visibleFaces: visibleFaces,
    svg: svg,
    arrows: arrows,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Cube3D;
  else root.Cube3D = Cube3D;
})(typeof window !== 'undefined' ? window : globalThis);
