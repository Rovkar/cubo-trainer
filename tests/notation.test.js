'use strict';
const path = require('path');
const Cube = require(path.join(__dirname, '..', 'js', 'cube.js'));
const Cube3D = require(path.join(__dirname, '..', 'js', 'cube3d.js'));
const NV = require(path.join(__dirname, '..', 'js', 'notation.js'));

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const S = () => Cube.solved('wca');

// 1. Geometria publica del motor
(function () {
  const g = Cube.stickerGeom('U', 8);
  check(eq(g, { p: [1, 1, 1], n: [0, 1, 0] }), 'stickerGeom U8 = URF');
  g.p[0] = 99;
  check(Cube.stickerGeom('U', 8).p[0] === 1, 'stickerGeom devuelve copia');
  check(eq(Cube.moveInfo('R'), { base: 'R', axis: 0, layers: [1], dir: -1, turns: 1 }), "moveInfo R");
  check(eq(Cube.moveInfo("R'"), { base: 'R', axis: 0, layers: [1], dir: 1, turns: 1 }), "moveInfo R'");
  check(eq(Cube.moveInfo('R2'), { base: 'R', axis: 0, layers: [1], dir: -1, turns: 2 }), 'moveInfo R2');
  check(Cube.moveInfo('Rw').base === 'r' && eq(Cube.moveInfo('Rw').layers, [0, 1]), 'moveInfo Rw = r');
  check(Cube.moveInfo("M'").dir === -1 && Cube.moveInfo('M').dir === 1, 'moveInfo M dir');
})();

// 2. Vista por defecto
(function () {
  const vis = Cube3D.visibleFaces(Cube3D.DEFAULT_VIEW);
  check(eq(vis.slice().sort(), ['F', 'R', 'U']), 'caras visibles = U,F,R (' + vis + ')');
  const center = (f) => {
    const g = Cube.stickerGeom(f, 4);
    return Cube3D.project([g.p[0] + g.n[0] * 0.5, g.p[1] + g.n[1] * 0.5, g.p[2] + g.n[2] * 0.5], Cube3D.DEFAULT_VIEW);
  };
  const U = center('U'), F = center('F'), R = center('R');
  check(U.y < F.y && U.y < R.y, 'U arriba de F y R');
  check(F.x < U.x && U.x < R.x, 'F a la izquierda, R a la derecha');
  ['D', 'L', 'B'].forEach((f) => {
    const g = Cube.stickerGeom(f, 4);
    check(Cube3D.project(g.n, Cube3D.DEFAULT_VIEW).depth <= 0, f + ' no visible');
  });
  // U[8] es el facelet de U adyacente a F y a R (esquina URF) y cae en el vertice inferior de la cara U
  const adj = [];
  for (let i = 0; i < 9; i++) {
    const g = Cube.stickerGeom('U', i);
    if (g.p[2] === 1 && g.p[0] === 1) adj.push(i);
  }
  check(eq(adj, [8]), 'U[8] unico facelet de U con x=1 y z=1');
  const corner = Cube3D.project([1.5, 1.5, 1.5], Cube3D.DEFAULT_VIEW);
  let best = -1, bd = Infinity;
  for (let i = 0; i < 9; i++) {
    const g = Cube.stickerGeom('U', i);
    const q = Cube3D.project([g.p[0], 1.5, g.p[2]], Cube3D.DEFAULT_VIEW);
    const d = Math.hypot(q.x - corner.x, q.y - corner.y);
    if (d < bd) { bd = d; best = i; }
  }
  check(best === 8, 'U[8] es el mas cercano al vertice URF proyectado');
  // y ese vertice es el punto mas bajo de la cara U en pantalla
  let maxY = -Infinity;
  [[-1.5, 1.5, -1.5], [1.5, 1.5, -1.5], [1.5, 1.5, 1.5], [-1.5, 1.5, 1.5]].forEach((p) => { maxY = Math.max(maxY, Cube3D.project(p, Cube3D.DEFAULT_VIEW).y); });
  check(Math.abs(maxY - corner.y) < 1e-9, 'vertice URF = punto mas bajo de U');
})();

// 3. Flechas derivadas del motor vs tabla
function dirOf(a) {
  if (a.kind === 'arc') return a.cw ? 'cw' : 'ccw';
  const dx = a.to[0] - a.from[0], dy = a.to[1] - a.from[1];
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? 'up' : 'down';
  return dx < 0 ? 'left' : 'right';
}
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left', cw: 'ccw', ccw: 'cw' };
const TABLE = {};
NV.MOVES.forEach((m) => { TABLE[m.move] = m; });
'U D R L F B r f M'.split(' ').forEach((m) => {
  check(!!TABLE[m], 'tabla tiene ' + m);
  const e = TABLE[m];
  [[m, e.expect], [m + "'", OPP[e.expect]]].forEach((pair) => {
    const on = Cube3D.arrows(pair[0], Cube3D.DEFAULT_VIEW).filter((a) => a.face === e.face);
    check(on.length > 0, pair[0] + ': hay flecha en la cara ' + e.face);
    on.forEach((a) => check(dirOf(a) === pair[1], pair[0] + ' en ' + e.face + ': esperado ' + pair[1] + ', obtenido ' + dirOf(a)));
  });
  // X2: mismas flechas que la base, con turns = 2
  const two = Cube3D.arrows(m + '2', Cube3D.DEFAULT_VIEW);
  check(two.length > 0 && two.every((a) => a.turns === 2), m + '2: flechas con turns 2');
  check(eq(two.map((a) => [a.face, a.kind]), Cube3D.arrows(m, Cube3D.DEFAULT_VIEW).map((a) => [a.face, a.kind])), m + '2: mismas flechas base');
});
// los tokens de la lista del encargo, uno por uno
'U U\' D D\' R R\' L L\' F F\' B B\' r r\' f f\' M M\''.split(' ').forEach((tok) => {
  check(Cube3D.arrows(tok, Cube3D.DEFAULT_VIEW).length > 0, 'arrows(' + tok + ') no vacio');
});
// Cada flecha sigue el movimiento REAL del motor (etiquetas unicas por facelet):
//  - lineas: el facelet central de la tira acaba en una posicion cuyo desplazamiento 3D tiene componente positiva sobre la tangente de la flecha;
//  - arcos: la esquina 0 de la cara girada se mueve en el sentido (horario/antihorario en pantalla) que dice la flecha.
(function () {
  const view = Cube3D.DEFAULT_VIEW;
  const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
  const ids = () => { const s = {}; FACES.forEach((f) => { s[f] = []; for (let i = 0; i < 9; i++) s[f].push(f + i); }); return s; };
  function where(after, id) {
    for (const f of FACES) for (let i = 0; i < 9; i++) if (after[f][i] === id) return [f, i];
    return null;
  }
  const sc = (f, i) => { const g = Cube.stickerGeom(f, i); return Cube3D.project([g.p[0] + g.n[0] * 0.5, g.p[1] + g.n[1] * 0.5, g.p[2] + g.n[2] * 0.5], view); };
  let lines = 0, arcs = 0;
  ['U', 'D', 'R', 'L', 'F', 'B', 'M', 'E', 'S', 'r', 'l', 'u', 'd', 'f', 'b'].forEach((m) => {
    [m, m + "'"].forEach((tok) => {
      const after = Cube.applyAlg(ids(), tok);
      Cube3D.arrows(tok, view).forEach((a) => {
        if (a.kind === 'line') {
          lines++;
          const mid = a.stickers[1], dest = where(after, a.face + mid);
          const p0 = Cube.stickerGeom(a.face, mid).p, p1 = Cube.stickerGeom(dest[0], dest[1]).p;
          const dot = (p1[0] - p0[0]) * a.dir3[0] + (p1[1] - p0[1]) * a.dir3[1] + (p1[2] - p0[2]) * a.dir3[2];
          check(dot > 0.5, tok + ' linea en ' + a.face + ': el facelet central se mueve a favor de la flecha (dot ' + dot.toFixed(2) + ')');
        } else {
          arcs++;
          const dest = where(after, a.face + '0');
          check(dest[0] === a.face, tok + ' arco en ' + a.face + ': la esquina 0 se queda en la cara');
          const c = sc(a.face, 4), o = sc(a.face, 0), d = sc(dest[0], dest[1]);
          const cr = (o.x - c.x) * (d.y - c.y) - (o.y - c.y) * (d.x - c.x);
          check((cr > 0) === a.cw, tok + ' arco en ' + a.face + ': sentido en pantalla coincide con el movimiento del facelet');
        }
      });
    });
  });
  check(lines > 40 && arcs >= 10, 'se probaron flechas de linea y de arco (' + lines + ', ' + arcs + ')');
})();

// 4. Pruebas rapidas fisicas (motor)
(function () {
  const all = (arr, c) => arr.every((x) => x === c);
  NV.MOVES.filter((m) => m.quick).forEach((mv) => {
    const q = mv.quick;
    const a = Cube.applyAlg(S(), mv.move), b = Cube.applyAlg(S(), mv.move + "'");
    check(all(q.cells.map((i) => a[q.face][i]), q.color), mv.move + ': ' + q.face + ' ' + q.cells + ' = ' + q.color);
    check(all(q.cells.map((i) => b[q.face][i]), q.prime), mv.move + "': " + q.face + ' ' + q.cells + ' = ' + q.prime);
  });
  const D = Cube.applyAlg(S(), 'D'), Dp = Cube.applyAlg(S(), "D'"), B = Cube.applyAlg(S(), 'B'), Bp = Cube.applyAlg(S(), "B'");
  check(all([D.F[6], D.F[7], D.F[8]], 'o'), 'D: fila inferior de F = naranja');
  check(all([Dp.F[6], Dp.F[7], Dp.F[8]], 'r'), "D': fila inferior de F = roja");
  check(all([B.U[0], B.U[1], B.U[2]], 'r'), 'B: fila trasera de U = roja');
  check(all([Bp.U[0], Bp.U[1], Bp.U[2]], 'o'), "B': fila trasera de U = naranja");
  // hechos de la tabla: R sube la columna derecha de F (le llega lo de D = amarillo), U lleva la fila superior a la izquierda (llega R = rojo)
  const R = Cube.applyAlg(S(), 'R'), U = Cube.applyAlg(S(), 'U'), M = Cube.applyAlg(S(), 'M');
  check(all([R.F[2], R.F[5], R.F[8]], 'y'), 'R: columna derecha de F recibe amarillo (D)');
  check(all([U.F[0], U.F[1], U.F[2]], 'r'), 'U: fila superior de F recibe rojo (R)');
  check(all([M.F[1], M.F[4], M.F[7]], 'w'), 'M: columna central de F recibe blanco (U) = sube lo de arriba, baja la columna');
  const r = Cube.applyAlg(S(), 'r');
  check(all([r.F[1], r.F[2], r.F[4], r.F[5], r.F[7], r.F[8]], 'y'), 'r: dos columnas derechas de F reciben amarillo');
  const f = Cube.applyAlg(S(), 'f');
  check(all([f.R[0], f.R[1], f.R[3], f.R[4], f.R[6], f.R[7]], 'w'), 'f: dos columnas frontales de R reciben blanco (U)');
  // F gira en sentido horario mirando la cara: la esquina F[0] (arriba-izq) va a F[2] (arriba-der)
  const Fm = Cube.applyAlg(Cube.applyAlg(S(), "R U F' L D2 B"), 'F');
  const F0 = Cube.applyAlg(S(), "R U F' L D2 B");
  check(Fm.F[2] === F0.F[0] && Fm.F[8] === F0.F[2] && Fm.F[6] === F0.F[8] && Fm.F[0] === F0.F[6], 'F: horario mirando la cara frontal');
})();

// 5. SVG bien formados
function wellFormed(s) {
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(s))) {
    if (m[4] === '/') continue;
    if (m[1] === '/') { if (stack.pop() !== m[2]) return false; }
    else stack.push(m[2]);
  }
  return stack.length === 0 && s.indexOf('<svg') === 0 && /<\/svg>$/.test(s) && !/NaN|undefined|Infinity/.test(s);
}
(function () {
  const toks = 'U U\' U2 D D\' R R\' L L\' F F\' B B\' r r\' f f\' M M\' R2'.split(' ');
  toks.forEach((tok) => {
    const s = Cube3D.svg(S(), { highlight: tok, arrows: tok, size: 150, title: 'x "q" <y>' });
    check(wellFormed(s), 'svg bien formado: ' + tok);
    check(/role="img"/.test(s) && /aria-label="/.test(s), 'svg con role=img y aria-label: ' + tok);
    check(!/<y>/.test(s), 'titulo escapado: ' + tok);
    check((s.match(/data-s="/g) || []).length === 27, 'svg tiene 27 facelets: ' + tok);
  });
  const lab = Cube3D.svg(S(), { labels: true });
  check(wellFormed(lab) && /<text/.test(lab), 'svg con etiquetas');
  check(['U', 'F', 'R'].every((f) => new RegExp('>' + f + '</text>').test(lab)), 'etiquetas U F R');
  // highlight: las piezas que no se mueven quedan tenues
  const hi = Cube3D.svg(S(), { highlight: 'R' });
  check((hi.match(/opacity="0.5"/g) || []).length === 12, 'R: 15 facelets visibles resaltados de 27 (12 tenues)');
  const hiM = Cube3D.svg(S(), { highlight: 'M' });
  check((hiM.match(/opacity="0.5"/g) || []).length === 27 - 6, 'M: 6 facelets visibles resaltados');
})();

// 6. Diagramas "despues" = stickers de Cube.applyAlg
(function () {
  const lang = 'en';
  NV.MOVES.forEach((mv) => {
    const html = NV.build(lang);
    check(html.indexOf('data-move="' + mv.move + '"') >= 0, 'tarjeta de ' + mv.move);
    const st = NV.afterState(mv.move);
    check(eq(st, Cube.applyAlg(S(), mv.move)), mv.move + ': afterState = applyAlg');
    const s = Cube3D.svg(st, { size: 150 });
    const re = /data-s="([UFR])(\d)" fill="(#\w+)"/g;
    let m, n = 0, ok = true;
    while ((m = re.exec(s))) { n++; if (Cube.COLORS[st[m[1]][+m[2]]] !== m[3]) ok = false; }
    check(n === 27 && ok, mv.move + ': el diagrama despues usa los stickers de applyAlg');
  });
  // y el HTML de la tarjeta incluye exactamente ese svg (misma cadena que genera svg())
  const html = NV.build('en');
  const aft = Cube3D.svg(Cube.applyAlg(S(), 'D'), { size: 150, title: NV.STRINGS.en['nt.alt.after'].replace('{m}', 'D') });
  check(html.indexOf(aft) >= 0, 'el HTML contiene el diagrama despues de D');
})();

// 7. Textos: ambas lenguas completas y sin llaves sin resolver
(function () {
  const en = NV.STRINGS.en, es = NV.STRINGS.es;
  const kEn = Object.keys(en).sort(), kEs = Object.keys(es).sort();
  check(eq(kEn, kEs), 'mismas claves nt.* en en y es');
  kEn.forEach((k) => check(k.indexOf('nt.') === 0, 'prefijo nt.: ' + k));
  ['en', 'es'].forEach((l) => {
    const html = NV.build(l);
    check(!/\{\w+\}/.test(html), l + ': sin placeholders sin resolver');
    check(!/nt\.[a-zA-Z]/.test(html.replace(/data-move="[^"]*"/g, '')), l + ': sin claves sin traducir');
    check(NV.MOVES.every((mv) => html.indexOf('data-move="' + mv.move + '"') >= 0), l + ': todas las tarjetas');
  });
  check(NV.build('en') !== NV.build('es'), 'en y es difieren');
  check(NV.build('en') === NV.build('en'), 'build cacheado');
  // sin DOM: render/mount no revientan
  NV.render();
  check(true, 'render sin mount no falla');
})();

console.log(passed + ' ok, ' + failed + ' fallos');
process.exit(failed ? 1 : 0);
