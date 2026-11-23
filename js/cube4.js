(function (root) {
  'use strict';

  // 4x4 engine, the 3x3 conventions (js/cube.js) generalized to N = 4.
  //   Axes: x right, y up, z front. dir = -1 is clockwise seen from the +axis side.
  //   Facelets (row-major, 16 per face): U seen from above with row 0 at the back; F/R/B/L seen from
  //   outside with row 0 at the top; D seen from below with row 0 at the front. The corner facelets
  //   0, 3, 12, 15 of every face are the 3x3 facelets 0, 2, 6, 8.
  // Notation (always written this way in the app; never the ambiguous lowercase r):
  //   R L U D F B      outer face            Rw Lw Uw Dw Fw Bw   the two outer layers (lowercase r l u d f b = same)
  //   2R 2L 2U 2D 2F 2B  inner slice only    3Rw 3Fw ...  three layers (all but the opposite face)
//   x y z               whole-cube rotations

  const N = 4;
  const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
  const SZ = N * N;

  // Position (cubie center on the in-face axes, +-1.5 on the normal axis) and normal of facelet i.
  function stickerGeom(face, i) {
    const r = Math.floor(i / N), c = i % N;
    const a = c - 1.5, b = r - 1.5; // a: left-to-right, b: top-to-bottom offsets
    switch (face) {
      case 'U': return { p: [a, 1.5, b], n: [0, 1, 0] };
      case 'R': return { p: [1.5, -b, -a], n: [1, 0, 0] };
      case 'F': return { p: [a, -b, 1.5], n: [0, 0, 1] };
      case 'D': return { p: [a, -1.5, -b], n: [0, -1, 0] };
      case 'L': return { p: [-1.5, -b, a], n: [-1, 0, 0] };
      default: return { p: [-a, -b, -1.5], n: [0, 0, -1] }; // B
    }
  }

  const GEOM = [];
  const KEY = new Map();
  FACES.forEach((f, fi) => {
    for (let i = 0; i < SZ; i++) {
      const g = stickerGeom(f, i);
      GEOM[fi * SZ + i] = g;
      KEY.set(g.p.join(',') + '|' + g.n.join(','), fi * SZ + i);
    }
  });

  // 90-degree rotation. dir = -1: clockwise seen from the +axis side; dir = +1: counterclockwise.
  function rot(v, axis, dir) {
    const x = v[0], y = v[1], z = v[2];
    if (dir === -1) {
      if (axis === 0) return [x, z, -y];
      if (axis === 1) return [-z, y, x];
      return [y, -x, z];
    }
    if (axis === 0) return [x, -z, y];
    if (axis === 1) return [z, y, -x];
    return [-y, x, z];
  }

  // Quarter turn of each face: [axis, side (+1/-1 along the axis), dir]
  const FACE_DEF = {
    R: [0, 1, -1], L: [0, -1, 1], U: [1, 1, -1], D: [1, -1, 1], F: [2, 1, -1], B: [2, -1, 1],
  };
  const OUTER = 1.5, INNER = 0.5;

  // Canonical move table: base token -> {axis, layers (cubie coordinates on the axis), dir}
  const MOVE_DEF = {};
  Object.keys(FACE_DEF).forEach((f) => {
    const axis = FACE_DEF[f][0], s = FACE_DEF[f][1], dir = FACE_DEF[f][2];
    const lay = (list) => list.map((v) => v * s).sort((p, q) => p - q);
    MOVE_DEF[f] = { axis: axis, layers: lay([OUTER]), dir: dir };
    MOVE_DEF[f + 'w'] = { axis: axis, layers: lay([OUTER, INNER]), dir: dir };
    MOVE_DEF['2' + f] = { axis: axis, layers: lay([INNER]), dir: dir };
    // three layers: the face, the inner slice next to it and the other inner slice (everything but the opposite face)
    MOVE_DEF['3' + f + 'w'] = { axis: axis, layers: lay([OUTER, INNER, -INNER]), dir: dir };
  });
  ['x', 'y', 'z'].forEach((r, axis) => {
    MOVE_DEF[r] = { axis: axis, layers: [-1.5, -0.5, 0.5, 1.5], dir: -1 };
  });

  // perm[destination] = source
  const PERM = {};
  Object.keys(MOVE_DEF).forEach((m) => {
    const def = MOVE_DEF[m];
    const perm = [];
    for (let s = 0; s < 6 * SZ; s++) {
      const g = GEOM[s];
      const cubie = g.p[def.axis]; // p is the cubie center, so this is its layer coordinate
      if (def.layers.indexOf(cubie) >= 0) {
        const np = rot(g.p, def.axis, def.dir), nn = rot(g.n, def.axis, def.dir);
        perm[KEY.get(np.join(',') + '|' + nn.join(','))] = s;
      } else perm[s] = s;
    }
    PERM[m] = perm;
  });

  function invPerm(p) { const q = []; p.forEach((s, d) => { q[s] = d; }); return q; }
  const TOKEN_PERM = {};
  Object.keys(PERM).forEach((m) => {
    const p = PERM[m];
    TOKEN_PERM[m] = p;
    TOKEN_PERM[m + "'"] = invPerm(p);
    TOKEN_PERM[m + '2'] = p.map((s) => p[s]);
  });

  function flatten(state) {
    const a = [];
    FACES.forEach((f) => { for (let i = 0; i < SZ; i++) a.push(state[f][i]); });
    return a;
  }
  function unflatten(a) {
    const s = {};
    FACES.forEach((f, fi) => { s[f] = a.slice(fi * SZ, fi * SZ + SZ); });
    return s;
  }

  const SCHEMES = {
    wca: { U: 'w', F: 'g', R: 'r', D: 'y', L: 'o', B: 'b' },
    yellowTop: { U: 'y', F: 'g', R: 'o', D: 'w', L: 'r', B: 'b' },
  };

  // base: 2R | 3Rw | Rw | R | r | x ; suffix: ' | 2 | 2'
  const TOKEN_RE = /^(2[UDLRFB]|3[UDLRFB]w|[UDLRFB]w|[UDLRFBudlrfb]|[xyz])(2'|2|')?$/;

  function invertToken(t) {
    if (t.endsWith('2')) return t;
    return t.endsWith("'") ? t.slice(0, -1) : t + "'";
  }

  const Cube4 = {
    N: N,
    COLORS: { w: '#FFFFFF', y: '#FFD500', g: '#009B48', b: '#0046AD', r: '#B71234', o: '#FF5800' },
    SCHEMES: SCHEMES,
    FACES: FACES,

    solved(scheme) {
      const sc = SCHEMES[scheme || 'wca'];
      if (!sc) throw new Error('Unknown scheme: ' + scheme);
      const s = {};
      FACES.forEach((f) => { s[f] = new Array(SZ).fill(sc[f]); });
      return s;
    },

    // Public geometry of a facelet (copy): cubie center p and normal n.
    stickerGeom(face, i) {
      const g = stickerGeom(face, i);
      return { p: g.p.slice(), n: g.n.slice() };
    },

    // Parse into normalized tokens (lowercase r -> Rw, "2'" -> 2). Parentheses and brackets are ignored.
    parseAlg(str) {
      if (Array.isArray(str)) str = str.join(' ');
      const clean = String(str == null ? '' : str).replace(/[()\[\]]/g, ' ').trim();
      if (!clean) return [];
      return clean.split(/\s+/).map((t) => {
        const m = TOKEN_RE.exec(t);
        if (!m) throw new Error('Invalid move: "' + t + '"');
        let base = m[1];
        if (/^[udlrfb]$/.test(base)) base = base.toUpperCase() + 'w';
        const suf = m[2] || '';
        return base + (suf === "'" ? "'" : suf ? '2' : '');
      });
    },

    // Data of a token: {base, axis, layers (cubie coordinates on the axis), dir, turns}.
    // X' flips dir (turns 1); X2 keeps the base dir (turns 2). base is the canonical name (Rw, 2R, R, x).
    moveInfo(token) {
      const toks = Cube4.parseAlg(token);
      if (toks.length !== 1) throw new Error('Invalid move: "' + token + '"');
      const t = toks[0];
      const suf = t.endsWith("'") ? "'" : t.endsWith('2') ? '2' : '';
      const base = suf ? t.slice(0, -1) : t;
      const def = MOVE_DEF[base];
      return {
        base: base,
        axis: def.axis,
        layers: def.layers.slice(),
        dir: suf === "'" ? -def.dir : def.dir,
        turns: suf === '2' ? 2 : 1,
      };
    },

    invertAlg(alg) {
      return Cube4.parseAlg(alg).reverse().map(invertToken).join(' ');
    },

    applyAlg(state, alg) {
      let a = flatten(state);
      Cube4.parseAlg(alg).forEach((t) => {
        const p = TOKEN_PERM[t];
        a = p.map((s) => a[s]);
      });
      return unflatten(a);
    },

    isSolved(state) {
      return FACES.every((f) => state[f].every((c) => c === state[f][0]));
    },

    // On-screen direction in which the stickers of `face` travel under `token` (quarter turn, or the
    // turn the token names), in the app's default iso view (F: right = +x, up = +y; U: right = +x,
    // up = toward the back; R: right = toward the back, up = +y). Derived from the engine geometry
    // (angular velocity x position). Returns 'up'|'down'|'left'|'right' for a face that is crossed by
    // the moving layers, 'cw'|'ccw' (seen from outside) when the face itself turns, null when untouched.
    flow(token, face) {
      const info = Cube4.moveInfo(token);
      const g = stickerGeom(face, 0);
      const n = g.n;
      const sgn = info.dir === -1 ? -1 : 1; // omega = sgn * e_axis
      if (n[info.axis] !== 0) {
        // the face is perpendicular to the axis: affected only when its own layer moves
        if (info.layers.indexOf(n[info.axis] * OUTER) < 0) return null;
        const seenFromPlusAxis = n[info.axis] > 0;
        const clockwiseFromPlus = sgn === -1;
        return clockwiseFromPlus === seenFromPlusAxis ? 'cw' : 'ccw';
      }
      // face parallel to the axis: some layer of the face moves along it
      const sample = [];
      for (let i = 0; i < SZ; i++) {
        const q = stickerGeom(face, i);
        const cub = q.p[info.axis];
        if (info.layers.indexOf(cub) >= 0) sample.push(q);
      }
      if (!sample.length) return null;
      const q = sample[0];
      const r = [q.p[0] + q.n[0] * 0.5, q.p[1] + q.n[1] * 0.5, q.p[2] + q.n[2] * 0.5];
      const w = [0, 0, 0]; w[info.axis] = sgn;
      const v = [w[1] * r[2] - w[2] * r[1], w[2] * r[0] - w[0] * r[2], w[0] * r[1] - w[1] * r[0]];
      const right = { F: [1, 0, 0], U: [1, 0, 0], R: [0, 0, -1], D: [1, 0, 0], L: [0, 0, 1], B: [-1, 0, 0] }[face];
      const up = { F: [0, 1, 0], U: [0, 0, -1], R: [0, 1, 0], D: [0, 0, 1], L: [0, 1, 0], B: [0, 1, 0] }[face];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const vr = dot(v, right), vu = dot(v, up);
      if (Math.abs(vu) > Math.abs(vr)) return vu > 0 ? 'up' : 'down';
      return vr > 0 ? 'right' : 'left';
    },

    // View of the last layer (top layer + the top row of the four sides), generalizing Cube.lastLayerView.
    // mask 'oll': yellow vs 'x'; 'pll' or none: colors. u has 16 stickers, b/r/f/l have 4 (seen from above:
    // b and r run left-to-right / top-to-bottom as drawn around the top face).
    lastLayerView(state, mask) {
      const u = state.U.slice();
      const b = [state.B[3], state.B[2], state.B[1], state.B[0]];
      const r = [state.R[3], state.R[2], state.R[1], state.R[0]];
      const f = [state.F[0], state.F[1], state.F[2], state.F[3]];
      const l = [state.L[0], state.L[1], state.L[2], state.L[3]];
      const v = { u: u, b: b, r: r, f: f, l: l };
      if (mask === 'oll') {
        const yx = (c) => (c === 'y' ? 'y' : 'x');
        for (let i = 0; i < SZ; i++) u[i] = yx(u[i]);
        [b, r, f, l].forEach((s) => { for (let i = 0; i < N; i++) s[i] = yx(s[i]); });
      }
      return v;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Cube4;
  else root.Cube4 = Cube4;
})(typeof window !== 'undefined' ? window : globalThis);
