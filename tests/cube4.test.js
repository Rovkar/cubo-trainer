'use strict';
// Tests for js/cube4.js (4x4 engine). Run: node tests/cube4.test.js
// Also exports the independent reference simulator (sticker position + normal, written separately from the
// engine) so tests/parity.test.js can cross-check the shipped algorithms with it.
const path = require('path');
const Cube = require(path.join(__dirname, '..', 'js', 'cube.js'));
const Cube4 = require(path.join(__dirname, '..', 'js', 'cube4.js'));

// ---------------------------------------------------------------------------------------------
// Independent reference simulator (a copy of the one used to verify the algorithms by hand).
// Different representation: a list of {p, n, c} with p = SURFACE point; layers by the cubie coordinate.
// Set REF4_PATH to run against another copy of that simulator instead.
// ---------------------------------------------------------------------------------------------
function makeRef() {
  const N = 4, H = (N - 1) / 2;
  const FACES = { U: [1, 1], D: [1, -1], R: [0, 1], L: [0, -1], F: [2, 1], B: [2, -1] };
  function rot(v, axis, dir) {
    const [x, y, z] = v;
    if (dir === -1) { if (axis === 0) return [x, z, -y]; if (axis === 1) return [-z, y, x]; return [y, -x, z]; }
    if (axis === 0) return [x, -z, y]; if (axis === 1) return [z, y, -x]; return [-y, x, z];
  }
  function solved(scheme) {
    const st = [];
    for (const f in FACES) {
      const [ax, s] = FACES[f];
      const others = [0, 1, 2].filter((a) => a !== ax);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const p = [0, 0, 0]; p[ax] = s * (H + 0.5); p[others[0]] = i - H; p[others[1]] = j - H;
        const n = [0, 0, 0]; n[ax] = s;
        st.push({ p, n, c: scheme[f] });
      }
    }
    return st;
  }
  const BASE = { R: [0, -1, 1], L: [0, 1, -1], U: [1, -1, 1], D: [1, 1, -1], F: [2, -1, 1], B: [2, 1, -1] };
  function layersFor(tok) {
    let m;
    if ((m = /^([xyz])$/.exec(tok))) { const ax = 'xyz'.indexOf(m[1]); return { ax, dir: -1, layers: [-1.5, -0.5, 0.5, 1.5] }; }
    if ((m = /^2([RLUDFB])$/.exec(tok))) { const [ax, dir, s] = BASE[m[1]]; return { ax, dir, layers: [s * 0.5] }; }
    if ((m = /^([RLUDFB])w$/.exec(tok)) || (m = /^([rludfb])$/.exec(tok))) { const F = m[1].toUpperCase(); const [ax, dir, s] = BASE[F]; return { ax, dir, layers: [s * 1.5, s * 0.5] }; }
    if ((m = /^([RLUDFB])$/.exec(tok))) { const [ax, dir, s] = BASE[m[1]]; return { ax, dir, layers: [s * 1.5] }; }
    throw new Error('bad token ' + tok);
  }
  function apply(st, alg) {
    st = st.map((s) => ({ p: s.p.slice(), n: s.n.slice(), c: s.c }));
    for (const raw of alg.trim().split(/\s+/)) {
      const m = /^(.*?)(2'|2|')?$/.exec(raw); const base = m[1], suf = m[2] || '';
      const { ax, dir, layers } = layersFor(base);
      const d = suf === "'" ? -dir : dir, times = suf.startsWith('2') ? 2 : 1;
      for (let t = 0; t < times; t++) for (const s of st) {
        const cub = s.p[ax] - s.n[ax] * 0.5;
        if (layers.some((l) => Math.abs(l - cub) < 1e-9)) { s.p = rot(s.p, ax, d); s.n = rot(s.n, ax, d); }
      }
    }
    return st;
  }
  const key = (s) => s.p.map((v) => Math.round(v * 2)).join(',') + '|' + s.n.join(',');
  function map(st) { const m = {}; st.forEach((s) => { m[key(s)] = s.c; }); return m; }
  function diff(a, b) { const A = map(a), B = map(b); return Object.keys(A).filter((k) => A[k] !== B[k]); }
  return { solved, apply, map, diff, key };
}
const ref = process.env.REF4_PATH ? require(process.env.REF4_PATH) : makeRef();

// ref state -> Cube4 face arrays, through the shared geometry (surface = p + 0.5 n)
const keyOf = (f, i) => {
  const g = Cube4.stickerGeom(f, i);
  return g.p.map((v, k) => Math.round((v + 0.5 * g.n[k]) * 2)).join(',') + '|' + g.n.join(',');
};
function refToFaces(st) {
  const m = ref.map(st), out = {};
  Cube4.FACES.forEach((f) => { out[f] = []; for (let i = 0; i < 16; i++) out[f].push(m[keyOf(f, i)]); });
  return out;
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function run() {
  let passed = 0, failed = 0;
  function check(cond, msg) {
    if (cond) passed++;
    else { failed++; console.log('FAIL: ' + msg); }
  }
  const rnd = mulberry32(20240607);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const SUF = ['', "'", '2'];
  const S = () => Cube4.solved('wca');
  const MIX = "R U F' L D2 B Rw' 2U Fw 2L' x Uw2 B2 2R'";
  const mixed = Cube4.applyAlg(S(), MIX);

  // 1. Geometry and solved states
  (function () {
    check(eq(Cube4.stickerGeom('U', 15), { p: [1.5, 1.5, 1.5], n: [0, 1, 0] }), 'U15 = URF corner facelet');
    check(eq(Cube4.stickerGeom('U', 0), { p: [-1.5, 1.5, -1.5], n: [0, 1, 0] }), 'U0 = ULB');
    check(eq(Cube4.stickerGeom('F', 0), { p: [-1.5, 1.5, 1.5], n: [0, 0, 1] }), 'F0 = UFL');
    check(eq(Cube4.stickerGeom('B', 0), { p: [1.5, 1.5, -1.5], n: [0, 0, -1] }), 'B0 = UBR (seen from behind)');
    const g = Cube4.stickerGeom('R', 3); g.p[0] = 99;
    check(Cube4.stickerGeom('R', 3).p[0] === 1.5, 'stickerGeom returns a copy');
    // facelet geometry: every (p, n) is unique, p on the in-face axes in {-1.5..1.5} and +-1.5 on the normal axis
    const seen = new Set();
    Cube4.FACES.forEach((f) => {
      for (let i = 0; i < 16; i++) {
        const q = Cube4.stickerGeom(f, i);
        seen.add(q.p.join(',') + '|' + q.n.join(','));
        check(q.p.every((v) => [-1.5, -0.5, 0.5, 1.5].indexOf(v) >= 0), f + i + ' coordinates');
        check(q.p.reduce((a, v, k) => a + (q.n[k] ? Math.abs(v) : 0), 0) === 1.5, f + i + ' normal axis = +-1.5');
      }
    });
    check(seen.size === 96, '96 distinct facelets');
    // corner facelets 0,3,12,15 <-> 3x3 facelets 0,2,6,8 (same sign pattern, 1.5 vs 1)
    Cube4.FACES.forEach((f) => {
      [[0, 0], [3, 2], [12, 6], [15, 8]].forEach((pr) => {
        const a = Cube4.stickerGeom(f, pr[0]), b = Cube.stickerGeom(f, pr[1]);
        check(eq(a.p.map(Math.sign), b.p.map(Math.sign)) && eq(a.n, b.n), f + pr[0] + ' corner matches 3x3 ' + pr[1]);
      });
    });
    ['wca', 'yellowTop'].forEach((sc) => {
      const s = Cube4.solved(sc), s3 = Cube.solved(sc);
      check(Cube4.FACES.every((f) => s[f].length === 16 && s[f].every((c) => c === s3[f][0])), sc + ' solved matches the 3x3 scheme');
    });
    let threw = false; try { Cube4.solved('nope'); } catch (e) { threw = true; }
    check(threw, 'unknown scheme throws');
    check(eq(Cube4.COLORS, Cube.COLORS), 'COLORS = Cube.COLORS');
    check(Cube4.N === 4, 'N = 4');
  })();

  // 2. Parsing and move info
  (function () {
    check(eq(Cube4.parseAlg("R U2 Rw' 2R2 Uw 2L' x y2 z'"), ['R', 'U2', "Rw'", '2R2', 'Uw', "2L'", 'x', 'y2', "z'"]), 'parseAlg tokens');
    check(eq(Cube4.parseAlg("r l' u2 d f2 b"), ['Rw', "Lw'", 'Uw2', 'Dw', 'Fw2', 'Bw']), 'lowercase = wide');
    check(eq(Cube4.parseAlg("(R U R' U')  [2R]"), ['R', 'U', "R'", "U'", '2R']), 'parentheses/brackets ignored');
    check(eq(Cube4.parseAlg("R2'"), ['R2']), "2' = 2");
    check(eq(Cube4.parseAlg(['R', "U'"]), ['R', "U'"]) && Cube4.parseAlg('').length === 0 && Cube4.parseAlg(null).length === 0, 'array / empty input');
    ['Q', 'R3', '3R', '2', 'Rww', 'M', 'S', 'E', '2x', "R''", 'w', '2R2R', 'R w'].forEach((bad) => {
      let msg = '';
      try { Cube4.parseAlg(bad); } catch (e) { msg = e.message; }
      check(/Invalid move/.test(msg), 'invalid token rejected: ' + bad);
    });
    check(eq(Cube4.moveInfo('R'), { base: 'R', axis: 0, layers: [1.5], dir: -1, turns: 1 }), 'moveInfo R');
    check(eq(Cube4.moveInfo("R'"), { base: 'R', axis: 0, layers: [1.5], dir: 1, turns: 1 }), "moveInfo R'");
    check(eq(Cube4.moveInfo('R2'), { base: 'R', axis: 0, layers: [1.5], dir: -1, turns: 2 }), 'moveInfo R2');
    check(eq(Cube4.moveInfo('Rw'), { base: 'Rw', axis: 0, layers: [0.5, 1.5], dir: -1, turns: 1 }), 'moveInfo Rw');
    check(eq(Cube4.moveInfo('r'), Cube4.moveInfo('Rw')), 'moveInfo r = Rw');
    check(eq(Cube4.moveInfo('3Rw'), { base: '3Rw', axis: 0, layers: [-0.5, 0.5, 1.5], dir: -1, turns: 1 }), 'moveInfo 3Rw (three layers)');
    check(eq(Cube4.parseAlg("3Rw 3Fw2 3Lw'"), ['3Rw', '3Fw2', "3Lw'"]), 'parseAlg 3Xw tokens');
    check(eq(Cube4.moveInfo('2R'), { base: '2R', axis: 0, layers: [0.5], dir: -1, turns: 1 }), 'moveInfo 2R');
    check(eq(Cube4.moveInfo("2R2"), { base: '2R', axis: 0, layers: [0.5], dir: -1, turns: 2 }), 'moveInfo 2R2');
    check(eq(Cube4.moveInfo("2L'"), { base: '2L', axis: 0, layers: [-0.5], dir: -1, turns: 1 }), "moveInfo 2L'");
    check(eq(Cube4.moveInfo('Lw').layers, [-1.5, -0.5]) && Cube4.moveInfo('Lw').dir === 1, 'moveInfo Lw');
    check(eq(Cube4.moveInfo("x'"), { base: 'x', axis: 0, layers: [-1.5, -0.5, 0.5, 1.5], dir: 1, turns: 1 }), "moveInfo x'");
    const dirs = { R: -1, L: 1, U: -1, D: 1, F: -1, B: 1 }, axes = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };
    Object.keys(dirs).forEach((f) => ['', 'w', ''].forEach((w, k) => {
      const t = k === 2 ? '2' + f : f + w;
      const mi = Cube4.moveInfo(t);
      check(mi.dir === dirs[f] && mi.axis === axes[f], t + ' dir/axis follow the 3x3 convention');
    }));
    // consistency with Cube.moveInfo for the 3x3 moves
    ['R', 'L', 'U', 'D', 'F', 'B'].forEach((f) => ['', "'", '2'].forEach((s) => {
      const a = Cube.moveInfo(f + s), b = Cube4.moveInfo(f + s);
      check(a.axis === b.axis && a.dir === b.dir && a.turns === b.turns, 'moveInfo ' + f + s + ' = 3x3');
    }));
    check(Cube4.invertAlg("R U2 Rw' 2R2 x") === "x' 2R2 Rw U2 R'", 'invertAlg');
    const sc = Cube4.applyAlg(S(), MIX);
    check(eq(Cube4.applyAlg(sc, MIX + ' ' + Cube4.invertAlg(MIX)), sc), 'alg followed by its inverse = id');
  })();

  // 3. Every token: X x4 = id, X X' = id, X2 = X X (solved and mixed)
  const TOKENS = [];
  ['R', 'L', 'U', 'D', 'F', 'B'].forEach((f) => { TOKENS.push(f, f + 'w', '2' + f, '3' + f + 'w'); });
  TOKENS.push('x', 'y', 'z', 'r', 'u', 'f', 'l', 'd', 'b');
  TOKENS.forEach((m) => {
    [S(), mixed].forEach((s0, k) => {
      const tag = m + (k ? ' (mixed)' : '');
      check(eq(Cube4.applyAlg(s0, [m, m, m, m].join(' ')), s0), tag + ' x4 = id');
      check(eq(Cube4.applyAlg(s0, m + " " + m + "'"), s0), tag + " X X' = id");
      check(eq(Cube4.applyAlg(s0, m + '2'), Cube4.applyAlg(s0, m + ' ' + m)), tag + ' X2 = X X');
      check(eq(Cube4.applyAlg(s0, m + "'"), Cube4.applyAlg(s0, m + ' ' + m + ' ' + m)), tag + " X' = X X X");
      check(Cube4.applyAlg(s0, m).U !== s0.U, tag + ' returns a new object');
    });
    check(!eq(Cube4.applyAlg(S(), m), S()), m + ' changes the solved cube');
  });
  // color counts are preserved and the input state is not mutated
  (function () {
    const cnt = (s) => { const c = {}; Cube4.FACES.forEach((f) => s[f].forEach((x) => { c[x] = (c[x] || 0) + 1; })); return c; };
    check(Object.keys(cnt(mixed)).every((k) => cnt(mixed)[k] === 16), 'every color 16 times after a mix');
    const s0 = S(), copy = JSON.stringify(s0);
    Cube4.applyAlg(s0, MIX);
    check(JSON.stringify(s0) === copy, 'applyAlg does not mutate its input');
  })();

  // 4. Decompositions between layer sets
  (function () {
    const decomp = {
      Rw: ['R 2R'], Lw: ['L 2L'], Uw: ['U 2U'], Dw: ['D 2D'], Fw: ['F 2F'], Bw: ['B 2B'],
      '2R': ["Rw R'"], '2L': ["Lw L'"], '2U': ["Uw U'"], '2D': ["Dw D'"], '2F': ["Fw F'"], '2B': ["Bw B'"],
      '3Rw': ["R 2R 2L'", 'x L'], '3Lw': ["L 2L 2R'", "x' R"], '3Uw': ["U 2U 2D'", 'y D'], '3Dw': ["D 2D 2U'", "y' U"], '3Fw': ["F 2F 2B'", 'z B'], '3Bw': ["B 2B 2F'", "z' F"],
      x: ["R 2R 2L' L'", "Rw Lw'"], y: ["U 2U 2D' D'", "Uw Dw'"], z: ["F 2F 2B' B'", "Fw Bw'"],
    };
    Object.keys(decomp).forEach((t) => decomp[t].forEach((d) => {
      [S(), mixed].forEach((s0, k) => check(eq(Cube4.applyAlg(s0, t), Cube4.applyAlg(s0, d)), t + ' = ' + d + (k ? ' (mixed)' : '')));
    }));
    // an outer turn and its opposite inner slice do not commute with the wrong layer set: Rw != R
    check(!eq(Cube4.applyAlg(S(), 'Rw'), Cube4.applyAlg(S(), 'R')), 'Rw != R');
    check(!eq(Cube4.applyAlg(S(), '2R'), Cube4.applyAlg(S(), 'Rw')), '2R != Rw');
    // the notation trap: Rw2 U2 Rw2 Uw2 Rw2 Uw2 is not 2R2 U2 2R2 Uw2 2R2 Uw2
    check(!eq(Cube4.applyAlg(S(), 'Rw2 U2 Rw2 Uw2 Rw2 Uw2'), Cube4.applyAlg(S(), '2R2 U2 2R2 Uw2 2R2 Uw2')), 'Rw2... != 2R2...');
  })();

  // 5. Cross-check vs the 3x3 engine: outer turns and rotations, corner facelets 0,3,12,15 <-> 0,2,6,8
  (function () {
    const toks = ['R', 'L', 'U', 'D', 'F', 'B', 'x', 'y', 'z'];
    let bad = 0;
    for (let n = 0; n < 500; n++) {
      const len = 1 + Math.floor(rnd() * 30);
      const seq = [];
      for (let i = 0; i < len; i++) seq.push(pick(toks) + pick(SUF));
      const a = seq.join(' ');
      const s4 = Cube4.applyAlg(Cube4.solved('yellowTop'), a), s3 = Cube.applyAlg(Cube.solved('yellowTop'), a);
      Cube4.FACES.forEach((f) => {
        [[0, 0], [3, 2], [12, 6], [15, 8]].forEach((pr) => { if (s4[f][pr[0]] !== s3[f][pr[1]]) bad++; });
        // outer turns and rotations leave the 4 inner stickers (centers) the same as the 3x3 center
        [5, 6, 9, 10].forEach((i) => { if (s4[f][i] !== s3[f][4]) bad++; });
      });
    }
    check(bad === 0, '500 random outer/rotation sequences: corners and centers agree with the 3x3 engine (' + bad + ' differences)');
    // lastLayerView corners agree with the 3x3 view on mixed states
    let badView = 0;
    for (let n = 0; n < 100; n++) {
      const seq = [];
      for (let i = 0; i < 20; i++) seq.push(pick(['R', 'L', 'U', 'D', 'F', 'B', 'x', 'y', 'z']) + pick(SUF));
      const a = seq.join(' ');
      ['oll', 'pll', undefined].forEach((mask) => {
        const v4 = Cube4.lastLayerView(Cube4.applyAlg(Cube4.solved('yellowTop'), a), mask === 'pll' ? undefined : mask);
        const v3 = Cube.lastLayerView(Cube.applyAlg(Cube.solved('yellowTop'), a), mask === 'pll' ? undefined : mask);
        [[0, 0], [3, 2], [12, 6], [15, 8]].forEach((pr) => { if (v4.u[pr[0]] !== v3.u[pr[1]]) badView++; });
        ['b', 'r', 'f', 'l'].forEach((s) => {
          if (v4[s][0] !== v3[s][0] || v4[s][3] !== v3[s][2]) badView++;
        });
      });
    }
    check(badView === 0, 'lastLayerView corners/edges ends agree with Cube.lastLayerView (' + badView + ')');
  })();

  // 6. Cross-check vs the independent reference simulator: all token kinds
  (function () {
    const toks = [];
    ['R', 'L', 'U', 'D', 'F', 'B'].forEach((f) => { toks.push(f, f + 'w', '2' + f); });
    toks.push('x', 'y', 'z');
    ['yellowTop', 'wca'].forEach((scn) => {
      const sch = Cube4.SCHEMES[scn];
      const r0 = ref.solved(sch), c0 = Cube4.solved(scn);
      check(eq(refToFaces(r0), c0), 'reference and engine solved states agree (' + scn + ')');
      let bad = 0;
      for (let n = 0; n < 300; n++) {
        const len = 1 + Math.floor(rnd() * 40);
        const seq = [];
        for (let i = 0; i < len; i++) seq.push(pick(toks) + pick(SUF));
        const a = seq.join(' ');
        if (!eq(refToFaces(ref.apply(r0, a)), Cube4.applyAlg(c0, a))) { bad++; if (bad < 4) console.log('  differs: ' + a); }
      }
      check(bad === 0, '300 random sequences incl. Rw/2R/Uw tokens equal the reference simulator (' + scn + ', ' + bad + ' differences)');
    });
    // lowercase aliases against the reference's own lowercase
    const a = "r U' l2 u d' f b2 R";
    check(eq(refToFaces(ref.apply(ref.solved(Cube4.SCHEMES.wca), a)), Cube4.applyAlg(Cube4.solved('wca'), a)), 'lowercase aliases agree with the reference');
  })();

  // 7. flow(): on-screen direction of the stickers, derived from geometry, checked against the real facelet movement
  (function () {
    const FACES = Cube4.FACES;
    const ids = () => { const s = {}; FACES.forEach((f) => { s[f] = []; for (let i = 0; i < 16; i++) s[f].push(f + ':' + i); }); return s; };
    // direction named from where the stickers come from, in the same screen axes as flow()
    const SRC = {
      F: { D: 'up', U: 'down', R: 'left', L: 'right' },
      U: { F: 'up', B: 'down', L: 'right', R: 'left' },
      R: { D: 'up', U: 'down', F: 'right', B: 'left' },
    };
    let compared = 0;
    TOKENS.filter((t) => /^[A-Z2]|^[xyz]/.test(t) && t.length <= 2).forEach((t) => {
      ['F', 'U', 'R', 'D', 'L', 'B'].forEach((face) => {
        const after = Cube4.applyAlg(ids(), t);
        const fl = Cube4.flow(t, face);
        // untouched face: all its stickers are still its own
        const own = after[face].every((id, i) => id === face + ':' + i);
        if (fl === null) { check(own, 'flow(' + t + ',' + face + ') = null only when the face is untouched'); return; }
        check(!own, 'flow(' + t + ',' + face + ') non-null => the face changes');
        if (fl === 'cw' || fl === 'ccw') {
          // the face itself turns: its top-left corner facelet 0 goes to 3 (cw seen from outside) or to 12 (ccw)
          check(fl === 'cw' ? after[face][3] === face + ':0' : after[face][12] === face + ':0',
            'flow(' + t + ',' + face + ') = ' + fl + ' matches the facelet movement');
          compared++;
          return;
        }
        if (!SRC[face]) return;
        // a sticker that came from a neighbour face: take the first facelet that left its own face
        const src = after[face].map((id) => id.split(':')[0]).find((f) => f !== face);
        check(SRC[face][src] === fl, 'flow(' + t + ',' + face + ') = ' + fl + ', stickers come from ' + src);
        compared++;
      });
    });
    check(compared > 50, 'flow compared against facelet movement (' + compared + ')');
    // flow(X') is the opposite of flow(X); X2 has the same flow as X
    const OPP = { up: 'down', down: 'up', left: 'right', right: 'left', cw: 'ccw', ccw: 'cw', null: null };
    TOKENS.forEach((t) => ['F', 'U', 'R'].forEach((face) => {
      check(Cube4.flow(t + "'", face) === OPP[Cube4.flow(t, face)], "flow(" + t + "') opposes flow(" + t + ') on ' + face);
      check(Cube4.flow(t + '2', face) === Cube4.flow(t, face), 'flow(' + t + '2) = flow(' + t + ') on ' + face);
    }));
  })();

  // 8. lastLayerView orientation (generalizes the 3x3 one)
  (function () {
    const st = {};
    Cube4.FACES.forEach((f) => { st[f] = []; for (let i = 0; i < 16; i++) st[f].push(f + i); });
    const v = Cube4.lastLayerView(st);
    check(eq(v.u, st.U) && eq(v.f, ['F0', 'F1', 'F2', 'F3']) && eq(v.l, ['L0', 'L1', 'L2', 'L3']), 'view u/f/l');
    check(eq(v.b, ['B3', 'B2', 'B1', 'B0']) && eq(v.r, ['R3', 'R2', 'R1', 'R0']), 'view b/r reversed');
    v.u[0] = 'zzz';
    check(st.U[0] === 'U0', 'view does not alias the state');
    const y = Cube4.solved('yellowTop');
    y.F[1] = 'y'; y.U[13] = 'g';
    const o = Cube4.lastLayerView(y, 'oll');
    check(o.u[13] === 'x' && o.f[1] === 'y' && o.u[5] === 'y' && o.r.every((c) => c === 'x') && o.f[0] === 'x', "oll mask: yellow vs 'x'");
    const p = Cube4.lastLayerView(y, 'pll');
    check(p.u[13] === 'g' && p.r[0] === 'o', 'pll mask keeps colors');
  })();

  console.log('cube4.test: ' + passed + ' passed, ' + failed + ' failed');
  if (failed) process.exit(1);
}

module.exports = { ref, refToFaces, makeRef, mulberry32 };
if (require.main === module) run();
