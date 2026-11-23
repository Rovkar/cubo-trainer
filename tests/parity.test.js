'use strict';
// Tests for js/parity4.js: the 4x4 parity algorithms, the four cases and their recipes.
// Run: node tests/parity.test.js
const path = require('path');
const Cube = require(path.join(__dirname, '..', 'js', 'cube.js'));
const Cube4 = require(path.join(__dirname, '..', 'js', 'cube4.js'));
const P = require(path.join(__dirname, '..', 'js', 'parity4.js'));
const ALGS3 = require(path.join(__dirname, '..', 'js', 'algs.js'));
const T4 = require(path.join(__dirname, 'cube4.test.js')); // independent reference simulator

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const Y = () => Cube4.solved('yellowTop');
const A3 = (id) => ALGS3.filter((a) => a.id === id)[0].alg;      // the Trainer algorithm as written for a 3x3
const A4 = (id) => P.trainerAlg(id).alg4;                          // the same algorithm written for a 4x4 (r -> 3Rw, f -> 3Fw, M -> 2L 2R')
const FACES = Cube4.FACES;

function changed(s, base) {
  const out = [];
  FACES.forEach((f) => { for (let i = 0; i < 16; i++) if (s[f][i] !== base[f][i]) out.push(f + i); });
  return out;
}
const refY = () => T4.ref.solved(Cube4.SCHEMES.yellowTop);
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
const refApply = (alg) => T4.refToFaces(T4.ref.apply(refY(), expand3(alg)));
const rotY = (st, k) => P.rotateY(st, k);

// ------------------------------------------------------------------------------------------
// 1. Notation entries: structured checks derived from the engine AND from real facelet movement
// ------------------------------------------------------------------------------------------
(function () {
  const ids = () => { const s = {}; FACES.forEach((f) => { s[f] = []; for (let i = 0; i < 16; i++) s[f].push(f + ':' + i); }); return s; };
  // direction named from the neighbour the stickers come from (screen axes of Cube4.flow)
  const SRC = {
    F: { D: 'up', U: 'down', R: 'left', L: 'right' },
    U: { F: 'up', B: 'down', L: 'right', R: 'left' },
    R: { D: 'up', U: 'down', F: 'right', B: 'left' },
  };
  const moves = P.NOTATION.map((n) => n.move);
  check(['R', '2R', 'Rw', 'Uw', 'x', 'Lw', '2L', 'U', 'F', 'B', 'y'].every((m) => moves.indexOf(m) >= 0), 'NOTATION covers R 2R Rw Uw x Lw 2L U F B y');
  check(new Set(moves).size === moves.length, 'NOTATION moves are unique');
  P.NOTATION.forEach((n) => {
    const c = n.check;
    check(c.move === n.move && ['up', 'down', 'left', 'right', 'cw', 'ccw'].indexOf(c.expect) >= 0 && !!c.face, n.move + ': well-formed check');
    check(Cube4.flow(c.move, c.face) === c.expect, n.move + ': engine flow on ' + c.face + ' = ' + c.expect + ' (got ' + Cube4.flow(c.move, c.face) + ')');
    check(Cube4.flow(c.move + "'", c.face) === { up: 'down', down: 'up', left: 'right', right: 'left', cw: 'ccw', ccw: 'cw' }[c.expect], n.move + ": prime reverses");
    // real facelet movement
    const after = Cube4.applyAlg(ids(), c.move);
    if (c.expect === 'cw') check(after[c.face][3] === c.face + ':0', n.move + ': facelet 0 goes to 3 (clockwise)');
    else if (c.expect === 'ccw') check(after[c.face][12] === c.face + ':0', n.move + ': facelet 0 goes to 12');
    else {
      const src = after[c.face].map((x) => x.split(':')[0]).find((f) => f !== c.face);
      check(SRC[c.face][src] === c.expect, n.move + ': stickers on ' + c.face + ' arrive from ' + src + ' => ' + SRC[c.face][src]);
    }
    // the kind agrees with the layers
    const mi = Cube4.moveInfo(n.move);
    const want = { outer: 1, inner: 1, wide: 2, wide3: 3, rotation: 4 }[n.kind];
    check(mi.layers.length === want, n.move + ': ' + n.kind + ' has ' + want + ' layer(s)');
    if (n.kind === 'inner') check(Math.abs(mi.layers[0]) === 0.5, n.move + ' is the inner slice');
    if (n.kind === 'outer') check(Math.abs(mi.layers[0]) === 1.5, n.move + ' is the outer face');
    // decomposition, in the engine and in the reference
    if (n.equiv) {
      check(eq(Cube4.applyAlg(Y(), n.move), Cube4.applyAlg(Y(), n.equiv)), n.move + ' = ' + n.equiv);
      check(eq(refApply(n.move), refApply(n.equiv)), n.move + ' = ' + n.equiv + ' (reference)');
    }
  });
  // every move base used by a 4x4 algorithm of this section has an entry (suffixes ignored)
  const used = new Set();
  const cases = P.CASES;
  const texts = [P.ALGS.OLL_PARITY, P.ALGS.PLL_PARITY, 'y'].concat(P.TRAINER.map((x) => x.alg4));
  cases.forEach((c) => c.steps.concat(c.shortcut || []).forEach((s) => { if (s.do === 'alg') texts.push(s.alg); }));
  texts.forEach((t) => Cube4.parseAlg(t).forEach((tok) => used.add(Cube4.moveInfo(tok).base)));
  used.forEach((b) => check(moves.indexOf(b) >= 0 || /^[RLUDFB]$/.test(b), 'notation entry for ' + b));
  ['2R', '2L', 'Uw', 'B', 'F', 'U', 'y', '3Rw', '3Fw'].forEach((b) => check(used.has(b), 'section really uses ' + b));
  // no ambiguous lowercase r/l/u/d/f/b tokens in any shipped 4x4 text
  texts.forEach((t) => check(!/(^|\s)[rludfb]['2]?(\s|$)/.test(t), 'no lowercase wide token in: ' + t));
})();

// ------------------------------------------------------------------------------------------
// 2. The algorithms
// ------------------------------------------------------------------------------------------
(function () {
  const base = Y();
  const inTopRow0 = (n) => /^[RLFB]([0-3])$/.test(n);
  // PLL parity: exactly 12 stickers, all in the top layer
  const pll = Cube4.applyAlg(base, P.ALGS.PLL_PARITY);
  const ch = changed(pll, base);
  check(ch.length === 12, 'PLL parity changes exactly 12 stickers (got ' + ch.length + ')');
  check(eq(ch.slice().sort(), ['B0', 'B3', 'F0', 'F3', 'L0', 'L1', 'L2', 'L3', 'R0', 'R1', 'R2', 'R3']), 'PLL parity: R and L top rows plus the four front/back corner stickers');
  check(ch.every(inTopRow0), 'PLL parity: all changes in the top layer (row 0 of the side faces)');
  check(pll.U.every((c, i) => c === base.U[i]) && pll.D.every((c, i) => c === base.D[i]), 'PLL parity leaves U and D faces as they are');
  // the changes are exactly: top-layer corners turned 180 (U2 on corners) + UL and UR dedges exchanged
  check(eq(pll.R.slice(0, 4), ['r', 'r', 'r', 'r']) && eq(pll.L.slice(0, 4), ['o', 'o', 'o', 'o']), 'PLL parity: top rows of R and L exchanged');
  check(pll.F[0] === 'b' && pll.F[3] === 'b' && pll.B[0] === 'g' && pll.B[3] === 'g' && pll.F[1] === 'g' && pll.F[2] === 'g', 'PLL parity: front/back corners exchanged, front/back edges untouched');
  // followed by U2: a clean swap of the UF and UB dedges
  const sw = Cube4.applyAlg(base, P.ALGS.PLL_PARITY + ' U2');
  check(eq(changed(sw, base).sort(), ['B1', 'B2', 'F1', 'F2']), 'PLL parity + U2 = clean UF<->UB dedge swap (4 stickers)');
  check(sw.F[1] === 'b' && sw.F[2] === 'b' && sw.B[1] === 'g' && sw.B[2] === 'g', 'swapped colors on F and B');
  check(Cube4.isSolved(Cube4.applyAlg(sw, P.ALGS.PLL_PARITY + ' U2')), 'PLL parity + U2 is an involution');
  check(Cube4.isSolved(Cube4.applyAlg(pll, P.ALGS.PLL_PARITY)), 'PLL parity applied twice = id');
  // centers and first three layers intact
  check(FACES.every((f) => [5, 6, 9, 10].every((i) => pll[f][i] === base[f][i])), 'PLL parity: centers intact');
  check(FACES.every((f) => f === 'U' || [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].every((i) => pll[f][i] === base[f][i])), 'PLL parity: layers 2-4 intact');
  // negative: the two-layer version breaks the middle layers
  const wide = Cube4.applyAlg(base, 'Rw2 U2 Rw2 Uw2 Rw2 Uw2');
  const wch = changed(wide, base);
  check(wch.some((n) => !inTopRow0(n)), 'negative: Rw2 version changes stickers outside the top layer (' + wch.length + ')');
  check(wch.some((n) => /^[FBRL](4|5|6|7|8|9|10|11)$/.test(n)), 'negative: Rw2 version breaks the middle layers');
  check(wch.some((n) => /^[UD](5|6|9|10)$/.test(n)) || wch.some((n) => /^[FBRL](5|6|9|10)$/.test(n)), 'negative: Rw2 version moves centers');

  // OLL parity: flips exactly one dedge (UF) and changes nothing else
  const oll = Cube4.applyAlg(base, P.ALGS.OLL_PARITY);
  check(eq(changed(oll, base).sort(), ['F1', 'F2', 'U13', 'U14']), 'OLL parity changes exactly U13 U14 F1 F2');
  check(oll.U[13] === 'g' && oll.U[14] === 'g' && oll.F[1] === 'y' && oll.F[2] === 'y', 'OLL parity: the UF dedge shows yellow on the front (flipped)');
  check(Cube4.parseAlg(P.ALGS.OLL_PARITY).length === 15, 'OLL parity has 15 moves');
  check(!/[xyz]/.test(P.ALGS.OLL_PARITY), 'OLL parity has no rotations (starts and ends in the same orientation)');
  check(Cube4.isSolved(Cube4.applyAlg(oll, P.ALGS.OLL_PARITY)), 'OLL parity is an involution');
  check(Cube4.isSolved(Cube4.applyAlg(oll, Cube4.invertAlg(P.ALGS.OLL_PARITY))), 'OLL parity inverse undoes it');
  check(P.PREDICATES('flippedEdgeFront', oll), 'after the alg on a solved cube exactly the front edge is flipped');
  check(FACES.every((f) => [5, 6, 9, 10].every((i) => oll[f][i] === base[f][i])), 'OLL parity: centers intact');
  // the wide-move version of the same sequence disturbs the corners (why the section uses inner slices)
  const owide = Cube4.applyAlg(base, "Rw2 B2 U2 Lw U2 Rw' U2 Rw U2 F2 Rw F2 Lw' B2 Rw2");
  check(changed(owide, base).length > 4 && ['U12', 'U15', 'F0', 'F3'].every((n) => changed(owide, base).indexOf(n) >= 0), 'negative: the wide-move version also moves corners');
  // other well-known OLL parity alg (with the x rotation) also disturbs other pieces: not used
  const owide2 = Cube4.applyAlg(base, "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'");
  check(changed(owide2, base).length > 4, 'negative: Rw U2 x ... flips the edge but also disturbs the corners (14 stickers), not used');
  // another alg from the literature that is also clean, just to show the choice is not unique
  check(eq(changed(Cube4.applyAlg(base, "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2"), base).sort(), ['F1', 'F2', 'U13', 'U14']), 'the 15-move inner-slice variant has the same clean effect');

  // reference simulator: identical effects, sticker by sticker
  [P.ALGS.OLL_PARITY, P.ALGS.PLL_PARITY, P.ALGS.PLL_PARITY + ' U2', P.ALGS.TPERM, 'Rw2 U2 Rw2 Uw2 Rw2 Uw2',
    "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'", "Rw2 B2 U2 Lw U2 Rw' U2 Rw U2 F2 Rw F2 Lw' B2 Rw2"].forEach((a) => {
    check(eq(refApply(a), Cube4.applyAlg(base, a)), 'reference simulator agrees on: ' + a);
  });
  const refDiff = T4.ref.diff(refY(), T4.ref.apply(refY(), P.ALGS.PLL_PARITY));
  check(refDiff.length === 12, 'reference simulator: PLL parity changes 12 stickers');
  const refOll = T4.ref.diff(refY(), T4.ref.apply(refY(), P.ALGS.OLL_PARITY));
  check(refOll.length === 4, 'reference simulator: OLL parity changes 4 stickers');
  const refRw = T4.ref.diff(refY(), T4.ref.apply(refY(), 'Rw2 U2 Rw2 Uw2 Rw2 Uw2'));
  check(refRw.some((k) => Number(k.split('|')[0].split(',')[1]) < 3), 'reference simulator: the Rw2 version changes stickers below the top layer');
})();

// ------------------------------------------------------------------------------------------
// 3. Recipe interpreter. Explores every hold branch; every branch must end solved.
// ------------------------------------------------------------------------------------------
const LOG = {};
function note(k, v) { (LOG[k] = LOG[k] || new Set()).add(v); }

// returns array of {ok, why, state}; one entry per branch
function runSteps(steps, state, tag, ctx) {
  ctx = ctx || {};
  if (!steps.length) {
    const ok = ctx.done === 'crossDone' ? P.PREDICATES('crossDone', state) : Cube4.isSolved(state);
    return [{ ok: ok, why: 'end of recipe, ' + (ctx.done || 'solved') + '=' + ok, state: state }];
  }
  const s = steps[0], rest = steps.slice(1);
  const out = [];
  if (s.do === 'hold') {
    const ks = P.holds(state, s.when);
    if (!ks.length) return [{ ok: false, why: 'no y orientation satisfies ' + s.when, state: state }];
    ks.forEach((k) => {
      note(tag + ' holds ' + s.when, k);
      runSteps(rest, rotY(state, k), tag, ctx).forEach((r) => out.push(r));
    });
    return out;
  }
  if (s.do === 'alg') {
    // an equivalent alternative (s.alt) is a second branch: both must reach the same end
    return [s.alg].concat(s.alt ? [s.alt] : []).reduce((acc, alg) => {
      const next = Cube4.applyAlg(state, alg);
      if (s.after && !P.PREDICATES(s.after, next)) return acc.concat([{ ok: false, why: 'after ' + alg + ' predicate ' + s.after + ' is false', state: next }]);
      return acc.concat(runSteps(rest, next, tag, ctx));
    }, []);
  }
  if (s.do === 'auf') {
    const a = P.aufSolve(state);
    if (a === null) return [{ ok: false, why: 'AUF does not solve it', state: state }];
    note(tag + ' auf', a || '(none)');
    return runSteps(rest, Cube4.applyAlg(state, a), tag, ctx);
  }
  if (s.do === 'then') {
    return runSteps(P.caseById(s.case).steps, state, tag + '>' + s.case, ctx);
  }
  if (s.do === 'then3x3') {
    if (s.set === 'OCLL') {
      // pure case: nothing is left; with context the caller checks the remaining 3x3 state itself
      return runSteps(rest, state, tag, ctx).map((r) => (r.ok || ctx.openEnd ? { ok: true, why: 'handed to the 3x3 flow', state: state } : r));
    }
    const ks = s.hold ? P.holds(state, s.hold) : [0, 1, 2, 3];
    if (!ks.length) return [{ ok: false, why: 'no y orientation satisfies ' + s.hold, state: state }];
    const last = !rest.length;
    if (s.hold) {
      // deterministic: apply the (single) alg from every valid hold, continue
      ks.forEach((k) => {
        const st = Cube4.applyAlg(rotY(state, k), A4(s.algs[0]));
        note(tag + ' then3x3 ' + s.set + ' holds ' + s.hold, k);
        if (last) {
          const a = P.aufSolve(st);
          out.push({ ok: a !== null, why: a !== null ? 'solved with AUF ' + a : 'not solved after ' + s.algs[0], state: st });
          if (a !== null) note(tag + ' final auf', a || '(none)');
        } else runSteps(rest, st, tag, ctx).forEach((r) => out.push(r));
      });
      return out;
    }
    // no hold predicate (the app's own EP step): some hold + one of the listed algs + AUF must solve it
    const sols = [];
    ks.forEach((k) => s.algs.forEach((id) => {
      const st = Cube4.applyAlg(rotY(state, k), A4(id));
      const a = P.aufSolve(st);
      if (a !== null) sols.push({ k: k, id: id, a: a });
    }));
    sols.forEach((x) => note(tag + ' 3x3 ' + s.set + ' solves with', x.id));
    return [{ ok: sols.length > 0 && last, why: sols.length ? 'solved by ' + sols.map((x) => x.id).join(',') : 'no ' + s.set + ' alg solves it', state: state }];
  }
  throw new Error('unknown step ' + s.do);
}
function checkCase(c, st, label, steps) {
  const res = runSteps(steps || c.steps, st, c.id, { done: c.done });
  check(res.length > 0, c.id + ' ' + label + ': at least one branch');
  res.forEach((r) => check(r.ok, c.id + ' ' + label + ': ' + r.why));
  return res;
}

// ------------------------------------------------------------------------------------------
// 4. Cases
// ------------------------------------------------------------------------------------------
(function () {
  check(eq(P.CASES.map((c) => c.id), ['oll-parity', 'oll-parity-1', 'pll-opposite', 'pll-adjacent', 'pll-corners', 'pll-cycle']), 'case ids fixed (the two OLL parity variants, then the PLL ones)');
  P.CASES.forEach((c) => {
    check(['oll', 'pll'].indexOf(c.step) >= 0 && ['oll', 'pll', 'eo'].indexOf(c.mask) >= 0 && typeof c.setup === 'string' && c.setup.length > 0, c.id + ': well-formed');
    check(c.step === c.mask || (c.step === 'oll' && c.mask === 'eo'), c.id + ': mask follows step (the 1-yellow case hides the corners: mask eo)');
    check(c.done === undefined || c.done === 'crossDone', c.id + ': done is the default (solved) or crossDone');
    c.steps.concat(c.shortcut || []).forEach((s) => {
      check(['hold', 'alg', 'auf', 'then', 'then3x3'].indexOf(s.do) >= 0, c.id + ': step kind ' + s.do);
      if (s.alt) { check(s.do === 'alg', c.id + ': only alg steps have an alt'); Cube4.parseAlg(s.alt); }
      if (s.when) check(P.PREDICATES.IDS.indexOf(s.when) >= 0, c.id + ': predicate ' + s.when + ' exists');
      if (s.hold) check(P.PREDICATES.IDS.indexOf(s.hold) >= 0, c.id + ': predicate ' + s.hold + ' exists');
      if (s.after) check(P.PREDICATES.IDS.indexOf(s.after) >= 0, c.id + ': predicate ' + s.after + ' exists');
      if (s.case) check(!!P.caseById(s.case), c.id + ': then ' + s.case + ' exists');
      if (s.do === 'alg') Cube4.parseAlg(s.alg);
      (s.algs || []).forEach((id) => check(ALGS3.some((a) => a.id === id), c.id + ': app alg ' + id + ' exists'));
    });
    (c.pre || []).forEach((p) => check(P.PREDICATES(p, P.caseState(c.id)), c.id + ': precondition ' + p));
    // recognized under every whole-cube y orientation, and never taken for another case
    [0, 1, 2, 3].forEach((k) => check(P.classify(rotY(P.caseState(c.id), k)) === c.id, c.id + ': classify under y^' + k + ' (got ' + P.classify(rotY(P.caseState(c.id), k)) + ')'));
    check(P.classify(Y()) === null, 'solved cube is no parity case');
  });

  P.CASES.forEach((c) => {
    const st0 = P.caseState(c.id);
    // starting orientation does not matter: the hold step picks the right y turns
    [0, 1, 2, 3].forEach((k) => checkCase(c, rotY(st0, k), 'start y^' + k));
    // the reference simulator builds the same case from the setup
    check(eq(refApply(c.setup), st0), c.id + ': setup identical in the reference simulator');
    // every alg of the recipe, in the reference too
    c.steps.concat(c.shortcut || []).filter((s) => s.do === 'alg').forEach((s) => check(eq(refApply(s.alg), Cube4.applyAlg(Y(), s.alg)), c.id + ': recipe alg agrees with the reference'));
  });

  // each hold step: at least one y orientation exists and holds are as expected
  const hs = (id, pred) => P.holds(P.caseState(id), pred);
  check(eq(hs('oll-parity', 'flippedEdgeFront'), [0]) && eq(hs('oll-parity', 'frontEdgeFlipped'), [0]), 'oll-parity: exactly one hold (flipped edge in front)');
  check(P.holds(P.caseState('oll-parity-1'), 'singleYellowBack').length === 1 && P.holds(P.caseState('oll-parity-1'), 'oneYellowOnTop').length === 4, 'oll-parity-1: exactly one hold puts the single yellow dedge at the back');
  check(eq(hs('pll-opposite', 'swappedEdgesFrontBack'), [0, 2]), 'pll-opposite: two holds (front/back swapped), either works');
  check(eq(hs('pll-adjacent', 'swappedEdgesFrontRight'), [0]), 'pll-adjacent: one hold');
  check(eq(hs('pll-corners', 'headlightsFrontOrBack'), [0, 2]), 'pll-corners: headlights in front or at the back (2 holds)');
  check(hs('pll-corners', 'headlightsLeft').length === 1, 'pll-corners: one hold puts the headlights on the left');
  check(eq(hs('pll-cycle', 'anyHold'), [0, 1, 2, 3]), 'pll-cycle: every hold works');

  // the setup states are exactly the described pieces
  const a = P.analyze;
  const homes = (st, kind) => a(st)[kind].map((x) => x.home).join('');
  check(homes(P.caseState('pll-opposite'), 'edges') === '2103' && homes(P.caseState('pll-opposite'), 'corners') === '0123', 'pll-opposite = UF<->UB, corners solved');
  check(homes(P.caseState('pll-adjacent'), 'edges') === '1023' && homes(P.caseState('pll-adjacent'), 'corners') === '0123', 'pll-adjacent = UF<->UR, corners solved');
  check(homes(P.caseState('pll-corners'), 'edges') === '0123' && homes(P.caseState('pll-corners'), 'corners') === '3120', 'pll-corners = UFR<->UFL, edges solved');
  check(homes(P.caseState('pll-cycle'), 'edges') === '2310' && homes(P.caseState('pll-cycle'), 'corners') === '0123', 'pll-cycle = four dedges in a 4-cycle, corners solved');
  check(a(P.caseState('oll-parity')).edges.map((x) => (x.oriented ? 1 : 0)).join('') === '0111', 'oll-parity = only UF flipped');
  check(a(P.caseState('oll-parity-1')).edges.map((x) => (x.oriented ? 1 : 0)).join('') === '0001' && a(P.caseState('oll-parity-1')).edges.every((x) => x.paired), 'oll-parity-1 = only the left dedge (UL) yellow on top, all paired (the photographed pattern)');
  check(changed(P.caseState('pll-adjacent'), Y()).sort().join() === 'F1,F2,R1,R2', 'pll-adjacent changes F1 F2 R1 R2 only');
  check(changed(P.caseState('pll-corners'), Y()).sort().join() === 'F0,F3,L3,R0', 'pll-corners changes F0 F3 L3 R0 only (two corner pieces)');
})();

// ------------------------------------------------------------------------------------------
// 5. The user's photographed state: yellow on top, red front / green right / blue left / orange back (standard),
//    front-top corners swapped (UFL: green on F and red on L, UFR: blue on F and red on R), all else solved.
// ------------------------------------------------------------------------------------------
(function () {
  const photo = { U: [], D: [], F: [], B: [], R: [], L: [] };
  const col = { U: 'y', D: 'w', F: 'r', B: 'o', R: 'g', L: 'b' };
  FACES.forEach((f) => { photo[f] = new Array(16).fill(col[f]); });
  photo.F[0] = 'g'; photo.L[3] = 'r';       // UFL
  photo.F[3] = 'b'; photo.R[0] = 'r';       // UFR
  check(P.classify(photo) === 'pll-corners', 'the photographed state is recognized as pll-corners');
  const c = P.caseById('pll-corners');
  const main = checkCase(c, photo, 'photo (main flow)');
  const short = checkCase(c, photo, 'photo (shortcut)', c.shortcut);
  check(main.length >= 1 && short.length >= 2, 'photo: main flow and shortcut explore their holds (' + main.length + ', ' + short.length + ')');
  // the same state expressed in the app colors (turn the whole cube y so green is in front) is a whole-cube rotation of the case setup
  const inApp = Cube4.applyAlg(photo, 'y');
  check(FACES.every((f) => inApp[f][5] === Y()[f][5]), 'photo seen with green in front has the app color scheme');
  // compare positions only: relabel the colors of a rotated state so its centers match the app scheme again
  const norm = (st) => {
    const m = {}; FACES.forEach((f) => { m[st[f][5]] = Y()[f][5]; });
    const o = {}; FACES.forEach((f) => { o[f] = st[f].map((x) => m[x]); });
    return o;
  };
  check(eq(norm(inApp), inApp), 'photo in app frame needs no relabeling');
  check([0, 1, 2, 3].some((k) => eq(norm(rotY(P.caseState('pll-corners'), k)), inApp)), 'the photographed state equals the pll-corners case state (up to a whole-cube y rotation)');
  // full walk-through on the photo: headlights are on the back
  check(P.PREDICATES('headlightsFrontOrBack', photo), 'photo: headlights at the back (front/back hold ok)');
  // with the headlights on the left or right side the shortcut produces an F-perm, which the T-perm does not solve
  [1, 3].forEach((k) => {
    const held = rotY(photo, k);
    check(!P.PREDICATES('headlightsFrontOrBack', held), 'photo turned y^' + k + ': headlights on a side, predicate false');
    const after = Cube4.applyAlg(held, P.ALGS.PLL_PARITY);
    const anySolves = [0, 1, 2, 3].some((h) => P.aufSolve(Cube4.applyAlg(rotY(after, h), P.ALGS.TPERM)) !== null);
    check(!anySolves, 'negative: parity alg with the headlights on a side is NOT solved by a T-perm (F-perm case)');
  });
  // main flow detail: T-perm with headlights left leaves exactly pll-opposite
  [P.holds(photo, 'headlightsLeft')].forEach((ks) => {
    check(ks.length === 1, 'photo: exactly one hold puts headlights on the left');
    const t = Cube4.applyAlg(rotY(photo, ks[0]), P.ALGS.TPERM);
    check(P.classify(t) === 'pll-opposite', 'photo: after the T-perm the cube is the pll-opposite case (got ' + P.classify(t) + ')');
    check(P.PREDICATES('cornersSolved', t), 'photo: corners solved after the T-perm');
  });
})();

// ------------------------------------------------------------------------------------------
// 6. Contexts: parity on top of a normal 3x3 last-layer problem
// ------------------------------------------------------------------------------------------
(function () {
  // OLL parity with a scrambled (but edge-oriented) top layer: after the parity alg the remaining state is the 3x3 scramble
  const ll = ['ocll-sune', 'ocll-antisune', 'ocll-h', 'ocll-pi', 'ocll-u', 'ocll-t', 'ocll-l', 'cp-adj', 'cp-diag', 'ep-ua', 'ep-ub'];
  let n = 0;
  ll.forEach((id) => {
    const scr = Cube4.applyAlg(Y(), Cube4.invertAlg(A4(id)));
    // the 4x4 forms never use a lowercase wide token or M (lowercase r would mean Rw in the 4x4 engine)
    check(!/(^|\s)[rludfbM]['2]?(\s|$)/.test(A4(id)), id + ': 4x4 alg has no lowercase / M tokens');
    ['', 'U', "U'", 'U2'].forEach((auf) => {
      const start = Cube4.applyAlg(scr, auf + ' ' + P.ALGS.OLL_PARITY);
      const ks = P.holds(start, 'frontEdgeFlipped');
      check(ks.length === 1, id + ' ' + auf + ': one hold with the flipped edge in front');
      ks.forEach((k) => {
        const held = rotY(start, k);
        check(P.PREDICATES('flippedEdgeFront', held), id + ' ' + auf + ': single flipped edge in front');
        const fixed = Cube4.applyAlg(held, P.ALGS.OLL_PARITY);
        check(P.PREDICATES('crossDone', fixed), id + ' ' + auf + ': cross complete after the parity alg');
        check(eq(fixed, rotY(Cube4.applyAlg(scr, auf), k)), id + ' ' + auf + ': parity alg leaves exactly the 3x3 state');
        n++;
      });
    });
  });
  check(n === ll.length * 4, 'OLL parity contexts run (' + n + ')');
  // The 3x3 step after the parity alg: from the scrambled 3x3 state, the inverse alg solves it
  ll.forEach((id) => {
    const scr = Cube4.applyAlg(Y(), Cube4.invertAlg(A4(id)));
    check(Cube4.isSolved(Cube4.applyAlg(scr, A4(id))), id + ': 4x4 alg solves its 4x4 case (reduced state)');
  });

  // three flipped edges (the odd case of the OLL parity): flip the front alg from a held orientation with a flipped edge in front
  const flipIn = (k) => ({ 0: '', 1: 'y', 2: 'y2', 3: "y'" })[k] + ' ' + P.ALGS.OLL_PARITY + ' ' + ({ 0: '', 1: "y'", 2: 'y2', 3: 'y' })[k];
  const three = Cube4.applyAlg(Y(), [0, 1, 2].map(flipIn).join(' '));
  const fl = (st) => P.analyze(st).edges.filter((e) => !e.oriented).length;
  check(fl(three) === 3, 'built a state with 3 flipped edges');
  check(P.classify(three) === 'oll-parity-1', '3 flipped edges (1 yellow dedge on top) are classified as oll-parity-1');
  const k3 = P.holds(three, 'frontEdgeFlipped');
  check(k3.length === 3, '3 flipped edges: 3 holds put a flipped edge in front');
  k3.forEach((k) => {
    const after = Cube4.applyAlg(rotY(three, k), P.ALGS.OLL_PARITY);
    check(fl(after) === 2, '3 flipped edges: after the alg 2 remain (a normal EO case), hold y^' + k);
    check(P.classify(after) === null, 'no more OLL parity after the alg (2 flipped is a normal EO case)');
  });
  // an even number of flipped edges is not parity
  const two = Cube4.applyAlg(Y(), [0, 1].map(flipIn).join(' '));
  check(fl(two) === 2 && P.classify(two) === null, '2 flipped edges: not OLL parity');
  check(P.classify(Cube4.applyAlg(Y(), [0, 1, 2, 3].map(flipIn).join(' '))) === null, '4 flipped edges: not OLL parity');

  // PLL parity inside a normal 4LLL flow: the corner step (T-perm, headlights left) first, edges afterwards, from any AUF of the corner step
  const corners = Cube4.applyAlg(Y(), P.caseById('pll-corners').setup);
  [0, 1, 2, 3].forEach((k) => {
    const st = rotY(corners, k);
    const ks = P.holds(st, 'headlightsLeft');
    ks.forEach((h) => {
      const t = Cube4.applyAlg(rotY(st, h), P.ALGS.TPERM);
      check(P.classify(t) === 'pll-opposite', 'corner step first, start y^' + k + ': left with pll-opposite');
    });
  });
  // pll-adjacent: which 3x3 edge alg finishes it
  const adj = Cube4.applyAlg(Cube4.applyAlg(P.caseState('pll-adjacent'), P.ALGS.PLL_PARITY), 'U2');
  check(eq(P.analyze(adj).edges.map((e) => e.home).join(''), '2013') || P.analyze(adj).edges.every((e) => e.home >= 0), 'pll-adjacent after the parity alg and U2: a clean 3-cycle of edges, corners untouched');
  check(P.PREDICATES('cornersSolved', adj) && !P.PREDICATES('edgesSolved', adj), 'pll-adjacent after the alg: corners solved, edges still to do');
  check(P.analyze(adj).edges.filter((e, i) => e.home !== i).length === 3, 'pll-adjacent after the alg: exactly 3 edges out of place (Ua/Ub case)');
  const finishers = [];
  ['ep-ua', 'ep-ub'].forEach((id) => [0, 1, 2, 3].forEach((k) => { if (P.aufSolve(Cube4.applyAlg(rotY(adj, k), A4(id))) !== null) finishers.push(id + '@y^' + k); }));
  check(eq(finishers, ['ep-ub@y^1']), 'pll-adjacent: only the Ub, from y^1 (solved edge at the back) with no AUF, finishes it (' + finishers.join(', ') + ')');
  check(P.aufSolve(Cube4.applyAlg(rotY(adj, 1), A3('ep-ub'))) === '', 'pll-adjacent: Ub from y^1 solves with no AUF');
  // without the U2 after the parity alg the cube is still solvable by Ub but needs a different AUF: the U2 keeps the corners solved for the EP step
  check(P.PREDICATES('cornersSolved', adj) && !P.PREDICATES('cornersSolved', Cube4.applyAlg(P.caseState('pll-adjacent'), P.ALGS.PLL_PARITY)), 'the U2 after the parity alg is what keeps the corners solved');
})();

// ------------------------------------------------------------------------------------------
// 7. Diagram data (what the view will draw for each case)
// ------------------------------------------------------------------------------------------
(function () {
  const rep = (s) => s.join('');
  const v = (id) => P.caseView(id);
  const oll = v('oll-parity');
  check(oll.u.length === 16 && oll.b.length === 4 && oll.r.length === 4 && oll.f.length === 4 && oll.l.length === 4, 'view shapes');
  check(oll.u[13] === 'x' && oll.u[14] === 'x' && oll.u.filter((c) => c === 'x').length === 2, "oll-parity view: U all yellow except the front dedge ('x' x2)");
  check(eq(oll.f, ['x', 'y', 'y', 'x']) && oll.b.every((c) => c === 'x') && oll.r.every((c) => c === 'x') && oll.l.every((c) => c === 'x'), 'oll-parity view: yellow on the front side stickers of the flipped edge');
  // the diagram of each variant shows exactly 3 / 1 yellow dedges on top (a dedge = its two wings)
  const WINGS = [1, 2, 4, 7, 8, 11, 13, 14];
  const yellowDedges = (view) => WINGS.filter((i) => view.u[i] === 'y').length / 2;
  check(yellowDedges(oll) === 3, 'oll-parity diagram: 3 yellow dedges on top');
  const oll1 = v('oll-parity-1');
  check(yellowDedges(oll1) === 1 && oll1.u[4] === 'y' && oll1.u[8] === 'y', 'oll-parity-1 diagram: 1 yellow dedge on top (the left one)');
  check([0, 3, 12, 15].every((i) => oll1.u[i] === 'x') && [5, 6, 9, 10].every((i) => oll1.u[i] === 'y'), 'oll-parity-1 diagram (mask eo): corners hidden, centers yellow');
  check(oll1.f.slice(1, 3).every((c) => c === 'y') && oll1.r.slice(1, 3).every((c) => c === 'y') && oll1.b.slice(1, 3).every((c) => c === 'y') && oll1.l.slice(1, 3).every((c) => c === 'x'), 'oll-parity-1 diagram: yellow on the side of the three flipped dedges, none on the left one');
  const opp = v('pll-opposite');
  check(rep(opp.u) === 'yyyyyyyyyyyyyyyy' && eq(opp.f, ['g', 'b', 'b', 'g']) && eq(opp.b, ['b', 'g', 'g', 'b']) && eq(opp.r, ['o', 'o', 'o', 'o']) && eq(opp.l, ['r', 'r', 'r', 'r']), 'pll-opposite view: front and back edge pairs show the opposite color');
  const adj = v('pll-adjacent');
  check(rep(adj.u) === 'yyyyyyyyyyyyyyyy' && eq(adj.f, ['g', 'o', 'o', 'g']) && eq(adj.r, ['o', 'g', 'g', 'o']) && eq(adj.b, ['b', 'b', 'b', 'b']) && eq(adj.l, ['r', 'r', 'r', 'r']), 'pll-adjacent view: front and right edge pairs exchanged');
  const cor = v('pll-corners');
  check(rep(cor.u) === 'yyyyyyyyyyyyyyyy' && eq(cor.f, ['o', 'g', 'g', 'r']) && eq(cor.l, ['r', 'r', 'r', 'g']) && eq(cor.r, ['o', 'o', 'o', 'g']) && eq(cor.b, ['b', 'b', 'b', 'b']), 'pll-corners view: two front corners exchanged, headlights at the back');
  P.CASES.forEach((c) => check(eq(P.caseView(c.id), Cube4.lastLayerView(Cube4.applyAlg(Y(), c.setup), c.mask)), c.id + ': caseView = lastLayerView(setup, mask)'));
})();

// ------------------------------------------------------------------------------------------
// 7b. The two OLL parity variants: 3 yellow dedges on top (one flipped) and 1 yellow dedge on top (three flipped).
//     Every recipe is run on the engine AND on the independent reference simulator (set REF4_PATH to use another copy).
// ------------------------------------------------------------------------------------------
(function () {
  const OLL = P.ALGS.OLL_PARITY, LINE = P.ALGS.EO_LINE;
  const SLOT = ['UF', 'UR', 'UB', 'UL'];
  const flags = (st) => P.analyze(st).edges.map((e) => (e.oriented ? 1 : 0)).join('');
  const crossDone = (st) => P.PREDICATES('crossDone', st);
  // flip the dedge that is at the front when the cube is turned y^k (a pure flip of that one dedge: verified in section 2)
  const flipSlot = (st, k) => Cube4.applyAlg(st, ['', 'y', 'y2', "y'"][k] + ' ' + OLL + ' ' + ['', "y'", 'y2', 'y'][k]);
  // which slot (0 UF, 1 UR, 2 UB, 3 UL) the flip of y^k hits, found on the solved cube
  const slotOfFlip = [0, 1, 2, 3].map((k) => flags(flipSlot(Y(), k)).indexOf('0'));
  check(eq(slotOfFlip.slice().sort(), [0, 1, 2, 3]), 'the four y rotations flip the four different dedges (' + slotOfFlip.join(',') + ')');

  // ---- the line algorithm is the Trainer one, with no r/f/M, so it is the same on a 4x4 ----
  check(LINE === A3('eo-line') && LINE === A4('eo-line') && !P.trainerAlg('eo-line').changed, "EO_LINE is the Trainer's eo-line, unchanged on a 4x4");
  check(!/[rludfbMxyz]/.test(LINE), 'EO_LINE has only outer face turns');

  // ---- predicates and the counting function ----
  check(P.yellowDedgesOnTop(Y()) === 4 && P.yellowDedgesOnTop(P.caseState('oll-parity')) === 3 && P.yellowDedgesOnTop(P.caseState('oll-parity-1')) === 1, 'yellowDedgesOnTop: 4 solved, 3 and 1 in the two variants');
  check(P.yellowDedgesOnTop(Cube4.applyAlg(Y(), '2R')) === null, 'yellowDedgesOnTop is null when the dedges are not all paired');
  check(P.PREDICATES('oneYellowOnTop', P.caseState('oll-parity-1')) && !P.PREDICATES('threeYellowOnTop', P.caseState('oll-parity-1')), 'oneYellowOnTop / threeYellowOnTop on the 1-yellow case');
  check(P.PREDICATES('threeYellowOnTop', P.caseState('oll-parity')) && !P.PREDICATES('oneYellowOnTop', P.caseState('oll-parity')), 'oneYellowOnTop / threeYellowOnTop on the 3-yellow case');
  check(!P.PREDICATES('oneYellowOnTop', Y()) && !P.PREDICATES('threeYellowOnTop', Y()), 'neither predicate holds on a solved cube');

  // ---- the setup of oll-parity-1 against a facelet-level construction written independently of any algorithm ----
  // a flipped dedge = each wing swaps its top sticker with its side sticker
  const EDGE_WINGS = { UF: [[13, 'F', 1], [14, 'F', 2]], UR: [[11, 'R', 1], [7, 'R', 2]], UB: [[2, 'B', 1], [1, 'B', 2]], UL: [[4, 'L', 1], [8, 'L', 2]] };
  const flipByHand = (st, names) => {
    const o = {}; FACES.forEach((f) => { o[f] = st[f].slice(); });
    names.forEach((n) => EDGE_WINGS[n].forEach((w) => { const t = o.U[w[0]]; o.U[w[0]] = o[w[1]][w[2]]; o[w[1]][w[2]] = t; }));
    return o;
  };
  const photo = flipByHand(Y(), ['UF', 'UR', 'UB']);
  check(flags(photo) === '0001', 'by hand: UF, UR and UB flipped leaves only the left dedge yellow on top');
  check(eq(photo, P.caseState('oll-parity-1')), 'oll-parity-1 setup = the by-hand state "only the left dedge yellow" (engine)');
  check(eq(refApply(P.caseById('oll-parity-1').setup), photo), 'oll-parity-1 setup = the by-hand state (reference simulator)');
  check(eq(flipByHand(Y(), ['UF']), P.caseState('oll-parity')), 'oll-parity setup = the by-hand state "one dedge flipped"');
  check(P.classify(photo) === 'oll-parity-1' && [0, 1, 2, 3].every((k) => P.classify(rotY(photo, k)) === 'oll-parity-1'), 'the photographed pattern is classified as oll-parity-1 from every y orientation');
  // the photo: the left dedge is the yellow one, held as in the photo (no turn). The recipe turns the cube so it is at the back.
  check(eq(P.holds(photo, 'singleYellowBack'), [1]), 'photo: one y turn puts the left yellow dedge at the back');
  check(P.PREDICATES('flippedEdgeFront', P.caseState('oll-parity')) && !P.PREDICATES('flippedEdgeFront', photo), 'flippedEdgeFront is the 3-yellow hold only');

  // ---- the recipe, run on the engine and on the reference simulator from the photographed state and every start orientation ----
  const c1 = P.caseById('oll-parity-1'), c3 = P.caseById('oll-parity');
  [0, 1, 2, 3].forEach((k) => {
    checkCase(c1, rotY(photo, k), 'photo, start y^' + k);
    checkCase(c3, rotY(P.caseState('oll-parity'), k), 'one dedge flipped, start y^' + k);
  });
  check(c1.done === 'crossDone' && c3.done === 'crossDone', 'both variants end in a complete cross');
  const hold1 = P.holds(photo, 'singleYellowBack')[0];
  const heldSeq = (k) => ['', 'y', 'y2', "y'"][k];
  ['U', "U'"].forEach((turn) => {
    const seq = heldSeq(hold1) + ' ' + OLL + ' ' + turn + ' ' + LINE;
    const eng = Cube4.applyAlg(photo, seq);
    check(crossDone(eng), 'photo: ' + turn + ' version ends with the cross complete (engine)');
    const ref = T4.refToFaces(T4.ref.apply(T4.ref.apply(refY(), expand3(c1.setup)), expand3(seq)));
    check(eq(ref, eng) && crossDone(ref), 'photo: ' + turn + ' version, reference simulator agrees with the engine and ends with the cross complete');
    // the steps in between, on the reference simulator
    const ref1 = T4.refToFaces(T4.ref.apply(T4.ref.apply(refY(), expand3(c1.setup)), expand3(heldSeq(hold1) + ' ' + OLL)));
    check(P.PREDICATES('lineFrontBack', ref1), 'photo: after the OLL parity algorithm the yellow dedges are front and back (reference)');
    check(P.PREDICATES('lineHorizontal', T4.refToFaces(T4.ref.apply(T4.ref.apply(refY(), expand3(c1.setup)), expand3(heldSeq(hold1) + ' ' + OLL + ' ' + turn)))), 'photo: ' + turn + ' makes the line horizontal (reference)');
  });
  // the full recipe never changes the centers or the first three layers
  const fin = Cube4.applyAlg(photo, heldSeq(hold1) + ' ' + OLL + ' U ' + LINE);
  check(FACES.every((f) => [5, 6, 9, 10].every((i) => rotY(fin, (4 - hold1) % 4)[f][i] === Y()[f][i])), 'photo: centers are where they were after the recipe');
  const finBack = rotY(fin, (4 - hold1) % 4);
  check(['F', 'R', 'B', 'L'].every((f) => [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].every((i) => finBack[f][i] === Y()[f][i])) && finBack.D.every((c, i) => c === Y().D[i]), 'photo: everything below the top layer is where it was after the recipe');

  // ---- negative checks: the texts say "do not hold it anywhere else" and "the quarter turn is needed" ----
  [0, 1, 2, 3].filter((k) => k !== hold1).forEach((k) => {
    const after = Cube4.applyAlg(rotY(photo, k), OLL);
    check(!P.PREDICATES('lineFrontBack', after) && !P.PREDICATES('lineHorizontal', after) && !crossDone(after), 'hold y^' + k + ' (yellow dedge not at the back): the OLL parity algorithm does not give a line');
    check(!crossDone(Cube4.applyAlg(Cube4.applyAlg(after, 'U'), LINE)), 'hold y^' + k + ' followed by U and the line algorithm does not complete the cross');
  });
  const afterOll = Cube4.applyAlg(rotY(photo, hold1), OLL);
  check(!crossDone(Cube4.applyAlg(afterOll, LINE)), 'without the quarter turn the line algorithm does not complete the cross (vertical line)');
  check(!P.PREDICATES('lineHorizontal', Cube4.applyAlg(afterOll, 'U2')) && !crossDone(Cube4.applyAlg(Cube4.applyAlg(afterOll, 'U2'), LINE)), 'a half turn instead of the quarter turn does not work');
  check(!crossDone(Cube4.applyAlg(rotY(photo, hold1), LINE)), 'the line algorithm alone does not complete a 1-yellow cross');

  // ---- arbitrary corners (and edge permutation) on top: the cross recipe must not depend on them ----
  // EO-preserving scrambles: inverses of the 3x3 last-layer algorithms (their 4x4 forms), random AUFs between them
  const rnd = T4.mulberry32(20261123);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const LL = ['ocll-sune', 'ocll-antisune', 'ocll-h', 'ocll-pi', 'ocll-u', 'ocll-t', 'ocll-l', 'cp-adj', 'cp-diag', 'ep-ua', 'ep-ub', 'ep-h', 'ep-z'];
  const AUFS = ['', 'U', "U'", 'U2'];
  let runs = 0, cornerStates = new Set(), edgePerms = new Set(), refRuns = 0;
  for (let n = 0; n < 150; n++) {
    let scr = Y(), text = '';
    const len = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < len; i++) { const a = pick(AUFS) + ' ' + (rnd() < 0.5 ? A4(pick(LL)) : Cube4.invertAlg(A4(pick(LL)))); text += ' ' + a; scr = Cube4.applyAlg(scr, a); }
    const lastAuf = pick(AUFS);
    text += ' ' + lastAuf;
    scr = Cube4.applyAlg(scr, lastAuf);
    check(flags(scr) === '1111' && P.analyze(scr).edges.every((e) => e.paired), 'scramble ' + n + ': all dedges yellow on top and paired');
    cornerStates.add(P.analyze(scr).corners.map((c) => c.home + ':' + (c.oriented ? 1 : 0)).join(' '));
    edgePerms.add(P.analyze(scr).edges.map((e) => e.home).join(''));
    // make the 1-yellow state: flip three of the four dedges (the yellow one is at a random place)
    const keep = Math.floor(rnd() * 4);
    let st = scr, flips = '';
    [0, 1, 2, 3].filter((k) => slotOfFlip[k] !== keep).forEach((k) => { st = flipSlot(st, k); flips += ' ' + heldSeq(k) + ' ' + OLL + ' ' + heldSeq((4 - k) % 4); });
    check(flags(st) === [0, 1, 2, 3].map((q) => (q === keep ? 1 : 0)).join('') && P.classify(st) === 'oll-parity-1', 'random corners ' + n + ': a 1-yellow state, yellow dedge at ' + SLOT[keep]);
    // the recipe with each start orientation, both quarter turns
    [0, 1, 2, 3].forEach((k0) => {
      const s0 = rotY(st, k0), ks = P.holds(s0, 'singleYellowBack');
      check(ks.length === 1, 'random corners ' + n + ' y^' + k0 + ': exactly one hold (single yellow at the back)');
      ['U', "U'"].forEach((turn) => {
        const seq = heldSeq(ks[0]) + ' ' + OLL + ' ' + turn + ' ' + LINE;
        const e1 = Cube4.applyAlg(s0, heldSeq(ks[0]) + ' ' + OLL);
        check(P.PREDICATES('lineFrontBack', e1), 'random corners ' + n + ': a line front-back after the OLL parity algorithm');
        const e2 = Cube4.applyAlg(e1, turn);
        check(P.PREDICATES('lineHorizontal', e2), 'random corners ' + n + ': horizontal line after ' + turn);
        const e3 = Cube4.applyAlg(e2, LINE);
        check(crossDone(e3), 'random corners ' + n + ' y^' + k0 + ' ' + turn + ': yellow cross complete');
        runs++;
        if (n % 10 === 0 && k0 === 0) { // the reference simulator replays the whole thing from the solved cube
          const full = text + flips + ' ' + seq;
          const r = T4.refToFaces(T4.ref.apply(refY(), expand3(full)));
          // the reference applies the same moves from the solved cube: here the rotation k0 is applied as a whole-cube y turn
          const eng = Cube4.applyAlg(Y(), full);
          check(eq(r, eng) && crossDone(r), 'random corners ' + n + ' ' + turn + ': reference simulator agrees and the cross is complete');
          refRuns++;
        }
      });
    });
  }
  check(runs === 150 * 4 * 2, 'random-corner recipe runs (' + runs + ')');
  check(cornerStates.size > 40 && edgePerms.size > 4, 'the scrambles give many different corner states and edge permutations (' + cornerStates.size + ', ' + edgePerms.size + ')');
  check(refRuns >= 15, 'reference simulator replays (' + refRuns + ')');

  // ---- classify: 1 and 3 yellow dedges on top, and nothing else, from every y turn and with arbitrary corners ----
  for (let n = 0; n < 40; n++) {
    let scr = Y();
    for (let i = 0; i < 2; i++) scr = Cube4.applyAlg(scr, pick(AUFS) + ' ' + A4(pick(LL)));
    const byCount = {};
    for (let mask = 0; mask < 16; mask++) {
      let st = scr;
      for (let k = 0; k < 4; k++) if (mask & (1 << k)) st = flipSlot(st, k);
      const flipped = [0, 1, 2, 3].filter((k) => mask & (1 << k)).length;
      // with 0, 2 or 4 flips the state can still be a PLL case (arbitrary last layer): it is just never an OLL parity
      [0, 1, 2, 3].forEach((r) => {
        const got = P.classify(rotY(st, r));
        if (flipped === 1) check(got === 'oll-parity', 'classify with 3 yellow dedges on top: oll-parity (got ' + got + ')');
        else if (flipped === 3) check(got === 'oll-parity-1', 'classify with 1 yellow dedge on top: oll-parity-1 (got ' + got + ')');
        else check(got !== 'oll-parity' && got !== 'oll-parity-1', 'classify with ' + (4 - flipped) + ' yellow dedges on top: not an OLL parity (got ' + got + ')');
      });
      byCount[flipped] = (byCount[flipped] || 0) + 1;
    }
    if (n === 0) check(eq(byCount, { 0: 1, 1: 4, 2: 6, 3: 4, 4: 1 }), 'all 16 flip patterns visited');
  }

  // ---- the Practice sequence of the Trainer: OLL parity + U + line algorithm, from the 1-yellow state with any AUF ----
  const seqP = OLL + ' U ' + LINE;
  AUFS.forEach((auf) => {
    const st = Cube4.applyAlg(Cube4.applyAlg(Y(), Cube4.invertAlg(seqP)), auf);
    check(P.classify(st) === 'oll-parity-1', 'practice 1-yellow sequence, AUF "' + auf + '": the setup is a 1-yellow state');
    const ks = P.holds(st, 'singleYellowBack');
    check(ks.length === 1, 'practice 1-yellow, AUF "' + auf + '": one hold');
    const out = Cube4.applyAlg(rotY(st, ks[0]), seqP);
    check(crossDone(out), 'practice 1-yellow, AUF "' + auf + '": sequence completes the cross');
    check(eq(T4.refToFaces(T4.ref.apply(T4.ref.apply(refY(), expand3(Cube4.invertAlg(seqP) + ' ' + auf + ' ' + heldSeq(ks[0]))), expand3(seqP))), out), 'practice 1-yellow, AUF "' + auf + '": reference simulator agrees');
  });
  check(Cube4.isSolved(Cube4.applyAlg(Cube4.applyAlg(Y(), Cube4.invertAlg(seqP)), seqP)), 'the practice sequence undoes its own inverse');

  // ---- the 3-yellow variant with arbitrary corners (the old context test covers the 3x3 states; this one uses the new hold) ----
  for (let n = 0; n < 60; n++) {
    let scr = Y();
    for (let i = 0; i < 2; i++) scr = Cube4.applyAlg(scr, pick(AUFS) + ' ' + A4(pick(LL)));
    const k = Math.floor(rnd() * 4), st = flipSlot(scr, k);
    check(P.classify(st) === 'oll-parity', '3-yellow random ' + n + ': classified');
    const ks = P.holds(st, 'flippedEdgeFront');
    check(ks.length === 1, '3-yellow random ' + n + ': one hold with the flipped dedge in front');
    check(crossDone(Cube4.applyAlg(rotY(st, ks[0]), OLL)), '3-yellow random ' + n + ': the algorithm completes the cross');
  }
})();

// ------------------------------------------------------------------------------------------
// 8. Interpreter self-test (the negative direction: broken recipes must fail)
// ------------------------------------------------------------------------------------------
(function () {
  const c = P.caseById('pll-opposite');
  const bad = runSteps([{ do: 'hold', when: 'swappedEdgesFrontBack' }, { do: 'alg', alg: 'Rw2 U2 Rw2 Uw2 Rw2 Uw2' }, { do: 'auf' }], P.caseState(c.id), 'neg', {});
  check(bad.every((r) => !r.ok), 'interpreter: the Rw2 version fails the pll-opposite recipe');
  const noHold = runSteps([{ do: 'alg', alg: P.ALGS.PLL_PARITY }, { do: 'auf' }], rotY(P.caseState(c.id), 1), 'neg', {});
  check(noHold.every((r) => !r.ok), 'interpreter: without the hold step a side-swapped case is not solved');
  const noAuf = runSteps([{ do: 'hold', when: 'swappedEdgesFrontBack' }, { do: 'alg', alg: P.ALGS.PLL_PARITY }], P.caseState(c.id), 'neg', {});
  check(noAuf.every((r) => !r.ok), 'interpreter: without the final U2 it is not solved');
  check(P.aufSolve(Cube4.applyAlg(Cube4.applyAlg(Y(), P.ALGS.PLL_PARITY + ' U2'), P.ALGS.PLL_PARITY)) === 'U2', 'the final AUF of pll-opposite is U2');
  let threw = false; try { P.PREDICATES('nope', Y()); } catch (e) { threw = true; }
  check(threw, 'unknown predicate throws');
  // an unsolved cube with a wrong center layout is not misclassified
  check(P.classify(Cube4.applyAlg(Y(), "R U R' U'")) === null, 'a random 3x3 scramble is not a parity case');
  check(P.classify(Cube4.applyAlg(Y(), '2R2 U2 2R2 Uw2')) === null, 'a broken state is not a parity case');
})();

// ------------------------------------------------------------------------------------------
// 9. The Trainer algorithms on a 4x4 (r -> 3Rw, f -> 3Fw, M -> 2L 2R')
// ------------------------------------------------------------------------------------------
(function () {
  // literal translations, written independently of P.to4x4
  const LIT = {
    'eo-l': "3Fw R U R' U' 3Fw'",
    'eo-dot': "F R U R' U' F' 3Fw R U R' U' 3Fw'",
    'ocll-t': "3Rw U R' U' 3Rw' F R F'",
    'ocll-l': "F' 3Rw U R' U' 3Rw' F R",
    'ep-h': '2L2 2R2 U 2L2 2R2 U2 2L2 2R2 U 2L2 2R2',
    'ep-z': "2L' 2R U 2L2 2R2 U 2L2 2R2 U 2L' 2R U2 2L2 2R2 U'",
  };
  check(eq(P.TRAINER.filter((x) => x.changed).map((x) => x.id).sort(), Object.keys(LIT).sort()), 'exactly the six algorithms with r, f or M change');
  Object.keys(LIT).forEach((id) => check(P.trainerAlg(id).alg4 === LIT[id], id + ': 4x4 form is ' + LIT[id]));
  check(P.TRAINER.length === ALGS3.length && P.TRAINER.every((x, i) => x.id === ALGS3[i].id && x.alg3 === ALGS3[i].alg), 'TRAINER lists all 16 algorithms of js/algs.js');
  check(P.TRAINER.filter((x) => !x.changed).every((x) => x.alg4 === x.alg3), 'the other ten are used as they are');
  check(eq(['M', "M'", 'M2', 'r', "r'", 'r2', 'f', "f'", 'f2', 'R'].map(P.to4x4), ["2L 2R'", "2L' 2R", '2L2 2R2', '3Rw', "3Rw'", '3Rw2', '3Fw', "3Fw'", '3Fw2', 'R']), 'token translation incl. suffixes');
  ['E', 'S', 'Q', 'R3'].forEach((bad) => { let th = false; try { P.to4x4(bad); } catch (e) { th = true; } check(th, 'to4x4 rejects ' + bad); });
  // never an ambiguous token
  P.TRAINER.forEach((x) => check(!/(^|\s)[rludfbM]['2]?(\s|$)/.test(x.alg4), x.id + ': 4x4 form has no lowercase / M token'));

  // lift of a 3x3 state to a 4x4 with centers solved (2x2 blocks) and dedges paired
  const idx3 = (i) => { const r = Math.floor(i / 4), c = i % 4; const q = (v) => (v === 0 ? 0 : v === 3 ? 2 : 1); return q(r) * 3 + q(c); };
  const lift = (s3) => { const o = {}; FACES.forEach((f) => { o[f] = []; for (let i = 0; i < 16; i++) o[f].push(s3[f][idx3(i)]); }); return o; };
  check(eq(lift(Cube.solved('yellowTop')), Y()), 'lift of the solved 3x3 is the solved 4x4');
  check(eq(lift(Cube.applyAlg(Cube.solved('yellowTop'), "R U R' U'")), Cube4.applyAlg(Y(), "R U R' U'")), 'lift commutes with plain face turns');
  // random reduced states: apply the 3x3 algorithm in the 3x3 engine and its 4x4 form in the 4x4 engine
  const scrambles = ['', "R U R' U'", "F R U R' U' F'", "R U2 R' U' R U' R'"];
  for (let i = 0; i < 12; i++) scrambles.push(Cube.randomScramble(20));
  let n = 0, neg = 0;
  P.TRAINER.forEach((x) => scrambles.forEach((scr) => {
    const s3 = Cube.applyAlg(Cube.solved('yellowTop'), scr);
    const want = lift(Cube.applyAlg(s3, x.alg3));
    const got = Cube4.applyAlg(lift(s3), x.alg4);
    check(eq(got, want), x.id + ' from "' + scr + '": the 4x4 form has exactly the 3x3 effect on a reduced cube');
    n++;
    if (x.changed) {
      // as written the algorithm is NOT valid on a 4x4: M does not exist, r and f turn only two layers
      let res = null;
      try { res = Cube4.applyAlg(lift(s3), x.alg3); } catch (e) { res = 'throws'; }
      check(res === 'throws' || !eq(res, want), x.id + ' as written for a 3x3 does not work on a 4x4');
      neg++;
    }
  }));
  check(n === 16 * scrambles.length && neg === 6 * scrambles.length, 'translation tests ran (' + n + ', ' + neg + ')');
  P.TRAINER.forEach((x) => {
    check(eq(T4.refToFaces(T4.ref.apply(refY(), expand3(x.alg4))), Cube4.applyAlg(Y(), x.alg4)), x.id + ': reference simulator agrees on the 4x4 form');
    // from a solved cube the 4x4 form keeps the dedges paired and the centers in place
    const st = Cube4.applyAlg(Y(), x.alg4);
    check(P.analyze(st).edges.every((e) => e.paired) && FACES.every((f) => [5, 6, 9, 10].every((i) => st[f][i] === Y()[f][5])), x.id + ': dedges paired and centers solved after the 4x4 form');
    // the inverse of the 4x4 form builds a case that the 4x4 form solves
    check(Cube4.isSolved(Cube4.applyAlg(Cube4.applyAlg(Y(), Cube4.invertAlg(x.alg4)), x.alg4)), x.id + ': 4x4 form solves its own case');
  });
  // the naive versions really do break a 4x4 (why the card exists): r -> Rw and f -> Fw unpair dedges or change more than the 3x3
  ['eo-l', 'eo-dot', 'ocll-t', 'ocll-l'].forEach((id) => {
    const st = Cube4.applyAlg(Y(), A3(id));
    check(P.analyze(st).edges.some((e) => !e.paired) || !eq(st, lift(Cube.applyAlg(Cube.solved('yellowTop'), A3(id)))), id + ' as written breaks the 4x4');
  });
  let threw = false; try { Cube4.applyAlg(Y(), A3('ep-h')); } catch (e) { threw = true; }
  check(threw, 'ep-h as written (M) is not a 4x4 move');
})();

// ------------------------------------------------------------------------------------------
// 10. Every dedge arrangement with the corners solved: the general rule
// ------------------------------------------------------------------------------------------
(function () {
  // all 24 arrangements of the four top dedges (corners and orientation solved), built by BFS from clean swaps and 3-cycles
  const sw = P.ALGS.PLL_PARITY + ' U2', ua = A3('ep-ua');
  const pre = ['', 'y', 'y2', "y'"], post = ['', "y'", 'y2', 'y'];
  const gens = [];
  for (let k = 0; k < 4; k++) { gens.push(pre[k] + ' ' + sw + ' ' + post[k]); gens.push(pre[k] + ' ' + ua + ' ' + post[k]); }
  const seen = new Map([[JSON.stringify(Y()), Y()]]);
  let fr = [Y()];
  while (fr.length) {
    const nx = [];
    fr.forEach((s) => gens.forEach((g) => { const t = Cube4.applyAlg(s, g); const k = JSON.stringify(t); if (!seen.has(k)) { seen.set(k, t); nx.push(t); } }));
    fr = nx;
  }
  check(seen.size === 24, 'all 24 dedge arrangements reached (' + seen.size + ')');
  const by = {};
  seen.forEach((s) => { const c = P.classify(s) || 'other'; by[c] = (by[c] || 0) + 1; });
  // identity + 8 three-cycles + 3 double swaps are 'other' (normal 3x3 cases); 6 swaps and 6 four-cycles are parity
  check(by['pll-opposite'] === 2 && by['pll-adjacent'] === 4 && by['pll-cycle'] === 6 && by.other === 12, 'classify: 2 opposite swaps, 4 adjacent swaps, 6 four-cycles (' + JSON.stringify(by) + ')');
  // for each of the 6 four-cycles and each of the 4 holds: parity + U2, then the normal step 4, then AUF
  let cycles = 0, runs = 0; const usedAlg = {};
  seen.forEach((s) => {
    if (P.classify(s) !== 'pll-cycle') return;
    cycles++;
    check(P.PREDICATES('cornersSolved', s) && !P.PREDICATES('edgesSolved', s), 'four-cycle: corners solved, edges not');
    // none of the plain step 4 algorithms solves it by itself, from any hold
    ['ep-ua', 'ep-ub', 'ep-h', 'ep-z'].forEach((id) => [0, 1, 2, 3].forEach((k) => check(P.aufSolve(Cube4.applyAlg(rotY(s, k), A4(id))) === null, 'four-cycle: ' + id + ' alone never solves it')));
    for (let k = 0; k < 4; k++) {
      const after = Cube4.applyAlg(Cube4.applyAlg(rotY(s, k), P.ALGS.PLL_PARITY), 'U2');
      check(P.PREDICATES('cornersSolved', after), 'four-cycle hold y^' + k + ': corners solved after parity + U2');
      let sol = null;
      for (let j = 0; j < 4 && !sol; j++) ['ep-ua', 'ep-ub', 'ep-h', 'ep-z'].forEach((id) => { if (!sol && P.aufSolve(Cube4.applyAlg(rotY(after, j), A4(id))) !== null) sol = id; });
      check(sol !== null, 'four-cycle hold y^' + k + ': parity + U2 leaves a normal step-4 case');
      usedAlg[sol] = (usedAlg[sol] || 0) + 1;
      runs++;
    }
  });
  check(cycles === 6 && runs === 24, '6 four-cycles x 4 holds (' + cycles + ' x ' + runs + ')');
  console.log('  four-cycles: step 4 afterwards = ' + JSON.stringify(usedAlg));
  // the shipped recipe of the case, from every start orientation, solves every branch
  const cc = P.caseById('pll-cycle');
  [0, 1, 2, 3].forEach((k) => checkCase(cc, rotY(P.caseState('pll-cycle'), k), 'start y^' + k));
  // the effects the texts describe, seen on the diagram right after the parity algorithm
  const homes = (st, kind) => P.analyze(st)[kind].map((x) => x.home).join('');
  const opp = Cube4.applyAlg(P.caseState('pll-opposite'), P.ALGS.PLL_PARITY);
  check(homes(opp, 'edges') === '2301' && homes(opp, 'corners') === '2301', 'pll-opposite right after the parity alg: front/back AND left/right dedges swapped, corners turned half a turn');
  const adj = Cube4.applyAlg(P.caseState('pll-adjacent'), P.ALGS.PLL_PARITY);
  check(homes(adj, 'corners') === '2301' && !P.PREDICATES('cornersSolved', adj), 'pll-adjacent right after the parity alg: corners turned half a turn');
  const cs = P.caseState('pll-corners');
  const heldFB = P.holds(cs, 'headlightsFrontOrBack').map((k) => Cube4.applyAlg(rotY(cs, k), P.ALGS.PLL_PARITY));
  check(heldFB.length === 2 && heldFB.every((st) => homes(st, 'edges') === '0321'), 'shortcut: right after the parity alg only the left and right dedges are swapped');
})();

// log of the branch facts (useful when writing the recipes)
Object.keys(LOG).sort().forEach((k) => console.log('  ' + k + ': ' + Array.from(LOG[k]).join(' | ')));
console.log('parity.test: ' + passed + ' passed, ' + failed + ' failed');
if (failed) process.exit(1);
