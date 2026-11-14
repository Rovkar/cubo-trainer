(function (root) {
  'use strict';

  const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

  // Posicion 3D (x derecha, y arriba, z frente) y normal de cada facelet (Kociemba).
  function stickerGeom(face, i) {
    const r = Math.floor(i / 3), c = i % 3;
    switch (face) {
      case 'U': return { p: [c - 1, 1, r - 1], n: [0, 1, 0] };
      case 'R': return { p: [1, 1 - r, 1 - c], n: [1, 0, 0] };
      case 'F': return { p: [c - 1, 1 - r, 1], n: [0, 0, 1] };
      case 'D': return { p: [c - 1, -1, 1 - r], n: [0, -1, 0] };
      case 'L': return { p: [-1, 1 - r, c - 1], n: [-1, 0, 0] };
      default: return { p: [1 - c, 1 - r, -1], n: [0, 0, -1] }; // B
    }
  }

  const GEOM = [];
  const KEY = new Map();
  FACES.forEach((f, fi) => {
    for (let i = 0; i < 9; i++) {
      const g = stickerGeom(f, i);
      GEOM[fi * 9 + i] = g;
      KEY.set(g.p.join(',') + '|' + g.n.join(','), fi * 9 + i);
    }
  });

  // Rotacion de 90 grados. dir=-1: horaria vista desde el lado +eje; dir=+1: antihoraria.
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

  // [eje, capas (coordenada en ese eje), dir]
  const MOVE_DEF = {
    R: [0, [1], -1], L: [0, [-1], 1], M: [0, [0], 1],
    U: [1, [1], -1], D: [1, [-1], 1], E: [1, [0], 1],
    F: [2, [1], -1], B: [2, [-1], 1], S: [2, [0], -1],
    r: [0, [0, 1], -1], l: [0, [-1, 0], 1],
    u: [1, [0, 1], -1], d: [1, [-1, 0], 1],
    f: [2, [0, 1], -1], b: [2, [-1, 0], 1],
    x: [0, [-1, 0, 1], -1], y: [1, [-1, 0, 1], -1], z: [2, [-1, 0, 1], -1],
  };

  // perm[destino] = origen
  const PERM = {};
  Object.keys(MOVE_DEF).forEach((m) => {
    const def = MOVE_DEF[m];
    const axis = def[0], layers = def[1], dir = def[2];
    const perm = [];
    for (let s = 0; s < 54; s++) {
      const g = GEOM[s];
      if (layers.indexOf(g.p[axis]) >= 0) {
        const np = rot(g.p, axis, dir), nn = rot(g.n, axis, dir);
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
    FACES.forEach((f) => { for (let i = 0; i < 9; i++) a.push(state[f][i]); });
    return a;
  }
  function unflatten(a) {
    const s = {};
    FACES.forEach((f, fi) => { s[f] = a.slice(fi * 9, fi * 9 + 9); });
    return s;
  }

  const SCHEMES = {
    wca: { U: 'w', F: 'g', R: 'r', D: 'y', L: 'o', B: 'b' },
    yellowTop: { U: 'y', F: 'g', R: 'o', D: 'w', L: 'r', B: 'b' },
  };

  const TOKEN_RE = /^([UDLRFBudlrfbMESxyz]|[UDLRFB]w)(2'|2|')?$/;

  const Cube = {
    COLORS: { w: '#FFFFFF', y: '#FFD500', g: '#009B48', b: '#0046AD', r: '#B71234', o: '#FF5800' },

    solved(scheme) {
      const sc = SCHEMES[scheme || 'wca'];
      if (!sc) throw new Error('Esquema desconocido: ' + scheme);
      const s = {};
      FACES.forEach((f) => { s[f] = new Array(9).fill(sc[f]); });
      return s;
    },

    // Geometria publica de un facelet (copia): posicion p y normal n.
    stickerGeom(face, i) {
      const g = stickerGeom(face, i);
      return { p: g.p.slice(), n: g.n.slice() };
    },

    // Datos del movimiento de un token: {base, axis, layers, dir, turns}.
    // X' invierte dir (turns 1); X2 conserva el dir base (turns 2).
    moveInfo(token) {
      const t = Cube.parseAlg(token)[0];
      if (!t) throw new Error('Movimiento invalido: "' + token + '"');
      const base = t[0], suf = t.slice(1);
      const def = MOVE_DEF[base];
      return {
        base: base,
        axis: def[0],
        layers: def[1].slice(),
        dir: suf === "'" ? -def[2] : def[2],
        turns: suf === '2' ? 2 : 1,
      };
    },

    parseAlg(str) {
      if (Array.isArray(str)) str = str.join(' ');
      const clean = String(str == null ? '' : str).replace(/[()\[\]]/g, ' ').trim();
      if (!clean) return [];
      return clean.split(/\s+/).map((t) => {
        const m = TOKEN_RE.exec(t);
        if (!m) throw new Error('Movimiento invalido: "' + t + '"');
        let base = m[1];
        if (base.length === 2) base = base[0].toLowerCase();
        const suf = m[2] || '';
        return base + (suf === "'" ? "'" : suf ? '2' : '');
      });
    },

    invertAlg(alg) {
      return Cube.parseAlg(alg).reverse().map((t) => {
        if (t.endsWith('2')) return t;
        return t.endsWith("'") ? t.slice(0, -1) : t + "'";
      }).join(' ');
    },

    applyAlg(state, alg) {
      let a = flatten(state);
      Cube.parseAlg(alg).forEach((t) => {
        const p = TOKEN_PERM[t];
        a = p.map((s) => a[s]);
      });
      return unflatten(a);
    },

    isSolved(state) {
      return FACES.every((f) => state[f].every((c) => c === state[f][0]));
    },

    randomScramble(length) {
      const n = length == null ? 20 : length;
      const axisOf = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
      const all = ['U', 'D', 'L', 'R', 'F', 'B'];
      const sufs = ['', "'", '2'];
      const out = [];
      for (let i = 0; i < n; i++) {
        const prev = out[i - 1], prev2 = out[i - 2];
        const blockAxis = prev && prev2 && axisOf[prev] === axisOf[prev2] ? axisOf[prev] : -1;
        const opts = all.filter((f) => f !== prev && axisOf[f] !== blockAxis);
        out.push(opts[Math.floor(Math.random() * opts.length)]);
      }
      return out.map((f) => f + sufs[Math.floor(Math.random() * 3)]).join(' ');
    },

    lastLayerView(state, mask) {
      const u = state.U.slice();
      const b = [state.B[2], state.B[1], state.B[0]];
      const r = [state.R[2], state.R[1], state.R[0]];
      const f = [state.F[0], state.F[1], state.F[2]];
      const l = [state.L[0], state.L[1], state.L[2]];
      const v = { u: u, b: b, r: r, f: f, l: l };
      const yx = (c) => (c === 'y' ? 'y' : 'x');
      if (mask === 'eo') {
        [0, 2, 6, 8].forEach((i) => { u[i] = 'x'; });
        [1, 3, 5, 7].forEach((i) => { u[i] = yx(u[i]); });
        [b, r, f, l].forEach((s) => { s[0] = 'x'; s[2] = 'x'; s[1] = yx(s[1]); });
      } else if (mask === 'oll') {
        for (let i = 0; i < 9; i++) u[i] = yx(u[i]);
        [b, r, f, l].forEach((s) => { for (let i = 0; i < 3; i++) s[i] = yx(s[i]); });
      } else if (mask === 'cp') {
        [b, r, f, l].forEach((s) => { s[1] = 'x'; });
      }
      return v;
    },

    caseStickers(alg, mask) {
      return Cube.lastLayerView(Cube.applyAlg(Cube.solved('yellowTop'), Cube.invertAlg(alg)), mask);
    },

    setupFor(alg) {
      const aufs = ['', 'U', "U'", 'U2'];
      const auf = aufs[Math.floor(Math.random() * 4)];
      return (Cube.invertAlg(alg) + ' ' + auf).trim();
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Cube;
  else root.Cube = Cube;
})(typeof window !== 'undefined' ? window : globalThis);
