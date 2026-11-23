'use strict';
// Tests for js/trainer4.js (Trainer cases in 4x4 mode) and the 'eo'/'cp' masks of Cube4.lastLayerView.
// Run: node tests/trainer4.test.js
// The Practice setups are checked on the engine (js/cube4.js) AND on the independent reference simulator of
// tests/cube4.test.js (set REF4_PATH to use another copy of it).
const path = require('path');
const Cube = require(path.join(__dirname, '..', 'js', 'cube.js'));
const Cube4 = require(path.join(__dirname, '..', 'js', 'cube4.js'));
const I18N = require(path.join(__dirname, '..', 'js', 'i18n.js'));
const P = require(path.join(__dirname, '..', 'js', 'parity4.js'));
const ALGS3 = require(path.join(__dirname, '..', 'js', 'algs.js'));
const T = require(path.join(__dirname, '..', 'js', 'trainer4.js'));
const T4 = require(path.join(__dirname, 'cube4.test.js')); // independent reference simulator + mulberry32

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const Y = () => Cube4.solved('yellowTop');

// 3Rw = R 2R 2L' etc. (the reference simulator only knows outer, inner and two-layer moves)
const EXP3 = { R: ['R', '2R', "2L'"], L: ['L', '2L', "2R'"], U: ['U', '2U', "2D'"], D: ['D', '2D', "2U'"], F: ['F', '2F', "2B'"], B: ['B', '2B', "2F'"] };
function expand3(alg) {
  return alg.trim().split(/\s+/).map((tok) => {
    const m = /^3([RLUDFB])w(2|')?$/.exec(tok);
    if (!m) return tok;
    const suf = m[2] || '';
    return EXP3[m[1]].map((t) => {
      const primed = t.endsWith("'"), bt = primed ? t.slice(0, -1) : t;
      if (suf === '2') return bt + '2';
      return suf === "'" ? (primed ? bt : bt + "'") : t;
    }).join(' ');
  }).join(' ');
}
const refY = () => T4.ref.solved(Cube4.SCHEMES.yellowTop);
const refApply = (alg) => T4.ref.apply(refY(), expand3(alg));
const refSolved = (st) => T4.ref.diff(refY(), st).length === 0;
const undoAuf = (auf) => (auf === 'U' ? "U'" : auf === "U'" ? 'U' : auf);

const ALL = T.CASES;
const PRACTICE = ALL.filter((c) => c.practice);
const LEARN = ALL.filter((c) => !c.practice);

// ---------------------------------------------------------------------------------------------
// 1. The case list
// ---------------------------------------------------------------------------------------------
(function () {
  const ids = ALL.map((c) => c.id);
  check(new Set(ids).size === ids.length, 'ids are unique');
  check(ids.every((id) => /^q4-[a-z0-9-]+$/.test(id)), 'ids start with q4- and have no dots or slashes');
  check(ALL.length === 16 + 5, '16 Trainer cases + 5 parity cases (got ' + ALL.length + ')');
  check(PRACTICE.length === 18 && LEARN.length === 3, 'Practice pool: the 16 + oll parity + pll opposite; 3 learn-only cards');
  check(eq(LEARN.map((c) => c.id), ['q4-pll-adjacent', 'q4-pll-corners', 'q4-pll-cycle']), 'learn-only cards are the three recipe parity cases');
  check(ids.indexOf('q4-oll-parity') >= 0 && ids.indexOf('q4-pll-opposite') >= 0, 'oll parity and pll opposite are practice cases');
  ALGS3.forEach((a3) => {
    const c = T.caseById('q4-' + a3.id);
    check(!!c, 'translated case q4-' + a3.id);
    if (!c) return;
    check(c.alg === P.trainerAlg(a3.id).alg4, c.id + ': alg is Parity4.trainerAlg alg4');
    check(c.set === a3.set && c.mask === a3.mask, c.id + ': same set and mask as the 3x3 case');
    check(c.name === a3.name && c.tip === a3.tip && c.setName === a3.setName, c.id + ': same name, set name and tip as the 3x3 case');
    check(c.practice === true, c.id + ': practice');
    check(!!c.note === P.trainerAlg(a3.id).changed, c.id + ': the note is present exactly when the 4x4 version differs');
  });
  check(ALGS3.filter((a3) => T.caseById('q4-' + a3.id).changed).length === 6, 'six translated cases changed');
  check(T.caseById('q4-oll-parity').alg === P.ALGS.OLL_PARITY && T.caseById('q4-oll-parity').mask === 'oll', 'oll parity uses Parity4.ALGS.OLL_PARITY');
  check(T.caseById('q4-pll-opposite').alg === P.ALGS.PLL_PARITY + ' U2', 'pll opposite is the parity algorithm then U2');
  check(T.caseById('q4-oll-parity').set === 'OLLP' && T.caseById('q4-pll-opposite').set === 'PLLP', 'new sets OLLP and PLLP');
  check(T.SET_ORDER.every((s) => ALL.some((c) => c.set === s)) && ALL.every((c) => T.SET_ORDER.indexOf(c.set) >= 0), 'SET_ORDER covers every set');
  check(T.practiceCases().length === 18, 'practiceCases()');
})();

// ---------------------------------------------------------------------------------------------
// 2. No 3x3-only notation in anything shown for a 4x4
// ---------------------------------------------------------------------------------------------
(function () {
  const STRICT = /^(2[UDLRFB]|3[UDLRFB]w|[UDLRFB]w|[UDLRFB]|[xyz])(2'|2|')?$/;
  const algsOf = (c) => [c.alg].concat((c.shows || []).map((x) => x.alg)).filter(Boolean);
  ALL.forEach((c) => {
    algsOf(c).forEach((alg) => {
      alg.trim().split(/\s+/).forEach((tok) => {
        check(STRICT.test(tok), c.id + ': token "' + tok + '" is a valid 4x4 token (no lowercase r/f/l/u/d/b, no M/E/S)');
      });
      let parsed = true;
      try { Cube4.parseAlg(alg); } catch (e) { parsed = false; }
      check(parsed, c.id + ': algorithm parses on Cube4');
    });
    if (c.practice) {
      for (let i = 0; i < 8; i++) {
        const setup = T.setupFor(c);
        setup.split(/\s+/).forEach((tok) => check(STRICT.test(tok), c.id + ': setup token "' + tok + '" is valid'));
      }
    }
  });
})();

// ---------------------------------------------------------------------------------------------
// 3. Practice setups are solved by the algorithm (+ AUF), on the engine and on the reference simulator
// ---------------------------------------------------------------------------------------------
(function () {
  PRACTICE.forEach((c) => {
    T.AUFS.forEach((auf) => {
      const setup = T.setupFor(c, auf);
      check(setup === (Cube4.invertAlg(c.alg) + ' ' + auf).trim(), c.id + ' [' + auf + ']: setup = inverse + AUF');
      const sol = (undoAuf(auf) + ' ' + c.alg).trim();
      const st = Cube4.applyAlg(Y(), setup);
      check(!Cube4.isSolved(st), c.id + ' [' + auf + ']: the setup is not already solved');
      check(Cube4.isSolved(Cube4.applyAlg(st, sol)), c.id + ' [' + auf + ']: engine solves the setup with ' + sol);
      const r = T4.ref.apply(refY(), expand3(setup));
      check(refSolved(T4.ref.apply(r, expand3(sol))), c.id + ' [' + auf + ']: reference simulator solves the setup');
      check(eq(T4.refToFaces(r), st), c.id + ' [' + auf + ']: engine and reference agree on the setup');
      check(refSolved(refApply(c.alg + ' ' + Cube4.invertAlg(c.alg))), c.id + ': alg then its inverse is the identity on the reference');
    });
    // the whole 3x3 part of the setup keeps the dedges paired and the centers solved only for the 16 translated cases
    if (c.base) {
      const a = P.analyze(Cube4.applyAlg(Y(), T.setupFor(c, '')));
      check(a.edges.every((e) => e.paired), c.id + ': a translated case keeps the dedges paired');
    }
  });
  // parity cases: also solvable the way the card says (turn the whole cube until the hold is right, then the algorithm).
  // A whole-cube turn does not undo the AUF of the setup: oll parity ends with an AUF; pll opposite starts with one
  // ("turn the top layer until the corners match their centers").
  (function () {
    const co = T.caseById('q4-oll-parity');
    T.AUFS.forEach((auf) => {
      const st = Cube4.applyAlg(Y(), T.setupFor(co, auf));
      const ks = P.holds(st, 'frontEdgeFlipped');
      check(ks.length > 0, co.id + ' [' + auf + ']: a y rotation puts the flipped dedge in front');
      if (!ks.length) return;
      const after = Cube4.applyAlg(P.rotateY(st, ks[0]), co.alg);
      check(P.PREDICATES('crossDone', after) && P.aufSolve(after) !== null, co.id + ' [' + auf + ']: hold, algorithm, then an AUF solves it');
    });
    const cp = T.caseById('q4-pll-opposite');
    T.AUFS.forEach((auf) => {
      let st = Cube4.applyAlg(Y(), T.setupFor(cp, auf));
      const turns = T.AUFS.filter((u) => P.PREDICATES('cornersSolved', Cube4.applyAlg(st, u)));
      check(turns.length === 1, cp.id + ' [' + auf + ']: exactly one top turn matches the corners to the centers');
      if (!turns.length) return;
      st = Cube4.applyAlg(st, turns[0]);
      const ks = P.holds(st, 'swappedEdgesFrontBack');
      check(ks.length > 0, cp.id + ' [' + auf + ']: a y rotation puts the swapped dedges front and back');
      if (!ks.length) return;
      check(Cube4.isSolved(Cube4.applyAlg(P.rotateY(st, ks[0]), cp.alg)), cp.id + ' [' + auf + ']: align, hold, then the algorithm solves it');
    });
  })();
  // the practice setup of the oll parity case really is one flipped dedge
  const stOll = Cube4.applyAlg(Y(), T.setupFor('q4-oll-parity', ''));
  check(P.classify(stOll) === 'oll-parity', 'q4-oll-parity setup classifies as oll-parity');
  const stOpp = Cube4.applyAlg(Y(), T.setupFor('q4-pll-opposite', ''));
  check(P.classify(stOpp) === 'pll-opposite', 'q4-pll-opposite setup classifies as pll-opposite');
  let threw = false;
  try { T.setupFor('q4-pll-cycle'); } catch (e) { threw = true; }
  check(threw, 'learn-only cases have no practice setup');
  // random AUF covers the four values
  const seen = {};
  for (let i = 0; i < 200; i++) seen[T.setupFor('q4-ocll-sune').replace(Cube4.invertAlg(T.caseById('q4-ocll-sune').alg), '').trim()] = 1;
  check(Object.keys(seen).length === 4, 'the random AUF takes all four values');
})();

// ---------------------------------------------------------------------------------------------
// 4. The 4x4 diagram of a translated case equals the 3x3 diagram expanded to 4x4
// ---------------------------------------------------------------------------------------------
// corner sticker -> corner, edge sticker -> both wings, center -> the 2x2 block
const U_MAP = { 0: [0], 1: [1, 2], 2: [3], 3: [4, 8], 4: [5, 6, 9, 10], 5: [7, 11], 6: [12], 7: [13, 14], 8: [15] };
const S_MAP = { 0: [0], 1: [1, 2], 2: [3] };
function expand(v3) {
  const v = { u: new Array(16), b: new Array(4), r: new Array(4), f: new Array(4), l: new Array(4) };
  Object.keys(U_MAP).forEach((i) => U_MAP[i].forEach((j) => { v.u[j] = v3.u[i]; }));
  ['b', 'r', 'f', 'l'].forEach((s) => Object.keys(S_MAP).forEach((i) => S_MAP[i].forEach((j) => { v[s][j] = v3[s][i]; })));
  return v;
}
(function () {
  ALGS3.forEach((a3) => {
    const c = T.caseById('q4-' + a3.id);
    const want = expand(Cube.caseStickers(a3.alg, a3.mask));
    check(eq(T.viewOf(c), want), c.id + ': 4x4 diagram = expanded 3x3 diagram (mask ' + a3.mask + ')');
    check(eq(T.viewOf(c.id), want), c.id + ': viewOf accepts the id');
  });
  // every mask, on many random 3x3-reachable states (face turns only keep the 4x4 dedges paired and the centers solved)
  const rnd = T4.mulberry32(4444);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  ['eo', 'oll', 'cp', 'pll', undefined].forEach((mask) => {
    for (let n = 0; n < 40; n++) {
      const len = 5 + Math.floor(rnd() * 25), toks = [];
      for (let i = 0; i < len; i++) toks.push(pick(['U', 'D', 'L', 'R', 'F', 'B']) + pick(['', "'", '2']));
      const s = toks.join(' ');
      const s3 = Cube.applyAlg(Cube.solved('yellowTop'), s);
      const s4 = Cube4.applyAlg(Y(), s);
      check(eq(Cube4.lastLayerView(s4, mask), expand(Cube.lastLayerView(s3, mask))), 'view of ' + String(mask) + ' = expanded 3x3 view for ' + s);
    }
  });
  // diagram of every case renders as a 4x4 top view svg
  ALL.forEach((c) => {
    const v = T.viewOf(c);
    check(v.u.length === 16 && ['b', 'r', 'f', 'l'].every((k) => v[k].length === 4), c.id + ': view shape');
    const svg = T.svg(v);
    check(/^<svg class="ll"/.test(svg) && (svg.match(/data-t="/g) || []).length === 32, c.id + ': svg with 16 + 16 cells');
  });
})();

// ---------------------------------------------------------------------------------------------
// 5. The 'eo' and 'cp' masks of Cube4.lastLayerView
// ---------------------------------------------------------------------------------------------
(function () {
  const st = {};
  Cube4.FACES.forEach((f) => { st[f] = []; for (let i = 0; i < 16; i++) st[f].push('g'); });
  // a made-up state: some yellow here and there, the rest other colors
  for (let i = 0; i < 16; i++) st.U[i] = i % 3 === 0 ? 'y' : 'r';
  st.F[1] = 'y'; st.F[2] = 'w'; st.F[0] = 'y'; st.F[3] = 'y';
  st.R[0] = 'y'; st.R[1] = 'b'; st.R[2] = 'y'; st.R[3] = 'o';
  st.B[0] = 'y'; st.B[1] = 'y'; st.B[2] = 'b'; st.B[3] = 'y';
  st.L[0] = 'w'; st.L[1] = 'o'; st.L[2] = 'y'; st.L[3] = 'y';
  const x = (c) => (c === 'y' ? 'y' : 'x');
  const CORNERS = [0, 3, 12, 15], CENTERS = [5, 6, 9, 10], WINGS = [1, 2, 4, 7, 8, 11, 13, 14];

  const eo = Cube4.lastLayerView(st, 'eo');
  check(CORNERS.every((i) => eo.u[i] === 'x'), 'eo: the four corners of the top are hidden');
  check(CENTERS.every((i) => eo.u[i] === st.U[i]), 'eo: the top centers keep their color');
  check(WINGS.every((i) => eo.u[i] === x(st.U[i])), 'eo: the top edge wings are yellow or x');
  const base = Cube4.lastLayerView(st);
  ['b', 'r', 'f', 'l'].forEach((s) => {
    check(eo[s][0] === 'x' && eo[s][3] === 'x', 'eo: side ' + s + ' corner stickers hidden');
    check(eo[s][1] === x(base[s][1]) && eo[s][2] === x(base[s][2]), 'eo: side ' + s + ' wings are yellow or x');
  });
  // eo is the 4x4 version of the 3x3 mask: the same picture when expanded
  const s3 = Cube.applyAlg(Cube.solved('yellowTop'), "F R U R' U' F'");
  const s4 = Cube4.applyAlg(Y(), "F R U R' U' F'");
  check(eq(Cube4.lastLayerView(s4, 'eo'), expand(Cube.lastLayerView(s3, 'eo'))), 'eo: matches the 3x3 mask on a line case');

  const cp = Cube4.lastLayerView(st, 'cp');
  check(eq(cp.u, st.U), 'cp: the top keeps all its colors');
  ['b', 'r', 'f', 'l'].forEach((s) => {
    check(cp[s][0] === base[s][0] && cp[s][3] === base[s][3], 'cp: side ' + s + ' corner stickers in color');
    check(cp[s][1] === 'x' && cp[s][2] === 'x', 'cp: side ' + s + ' edge stickers hidden');
  });

  // masks never alias or modify the state, and unknown masks still return the colors
  check(st.U[0] === 'y' && st.F[1] === 'y' && st.R[1] === 'b', 'masks do not modify the state');
  check(eq(Cube4.lastLayerView(st, 'pll'), base) && eq(Cube4.lastLayerView(st, 'nope'), base), 'pll and unknown masks keep the colors');
  // oll unchanged
  const oll = Cube4.lastLayerView(st, 'oll');
  check(oll.u.every((c, i) => c === x(st.U[i])) && oll.f.every((c, i) => c === x(base.f[i])), 'oll mask unchanged');
})();

// ---------------------------------------------------------------------------------------------
// 6. Texts: 't4.' keys in both languages, and every case speaks both
// ---------------------------------------------------------------------------------------------
(function () {
  const keys = (l) => Object.keys(I18N.dict[l]).filter((k) => k.indexOf('t4.') === 0).sort();
  check(keys('en').length > 20, 'there are t4. strings');
  check(eq(keys('en'), keys('es')), 't4. keys: English and Spanish have the same keys');
  ['en', 'es'].forEach((l) => keys(l).forEach((k) => check(String(I18N.dict[l][k]).trim().length > 0, l + ' ' + k + ' is not empty')));
  // every literal 't4.*' key used by the code exists in both languages (the dynamic ones are checked through the cases below)
  const fs = require('fs');
  ['trainer.js', 'trainer4.js'].forEach((f) => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
    const used = {};
    (src.match(/'t4\.[\w.-]+'/g) || []).forEach((k) => { used[k.slice(1, -1)] = 1; });
    Object.keys(used).filter((k) => !k.endsWith('.')).forEach((k) => check(k in I18N.dict.en && k in I18N.dict.es, f + ' uses ' + k + ': defined in en and es'));
  });
  ALL.forEach((c) => ['name', 'tip'].forEach((p) => {
    if (c.base) return;
    check(('t4.c.' + c.id + '.' + p) in I18N.dict.en && ('t4.c.' + c.id + '.' + p) in I18N.dict.es, c.id + ' ' + p + ' key in en and es');
  }));
  const saved = I18N.lang;
  const text = {};
  ['en', 'es'].forEach((l) => {
    I18N.lang = l;
    text[l] = ALL.map((c) => [c.name, c.setName, c.tip, c.hold, c.summary || '', c.note].join('|'));
    ALL.forEach((c) => {
      check(c.name && c.setName && c.tip, l + ' ' + c.id + ': name, set name and tip');
      if (c.practice && !c.base) check(c.hold, l + ' ' + c.id + ': hold text');
      if (!c.practice) check(c.summary, l + ' ' + c.id + ': recipe summary');
    });
    (c => check(!!c.note && /4x4/.test(c.note), l + ': changed cases carry a note'))(T.caseById('q4-eo-l'));
    check(!T.caseById('q4-ocll-sune').note, l + ': unchanged cases carry no note');
  });
  I18N.lang = saved;
  check(text.en.join() !== text.es.join(), 'the cases change with the language');
  // the note and the cards never write the 3x3-only moves (r, f, M) as 4x4 notation
  ['en', 'es'].forEach((l) => {
    I18N.lang = l;
    ALL.forEach((c) => [c.note, c.hold, c.summary || ''].forEach((s) => check(!/(^|\s)[rfM]2?'?(\s|$|[.,])/.test(s), l + ' ' + c.id + ': no 3x3 r/f/M in the text')));
  });
  I18N.lang = saved;
})();

console.log('trainer4.test: ' + passed + ' passed, ' + failed + ' failed');
if (failed) process.exit(1);
