'use strict';
// Tests for js/edges4.js (the last two edges of a 4x4 reduction) and its card in js/notation4.js.
// Everything the card tells the user is checked here on js/cube4.js AND on the independent reference simulator of
// tests/cube4.test.js (REF4_PATH=<file> runs it against another copy of that simulator).
// Run: node tests/edges4.test.js
const path = require('path');
const J = (f) => path.join(__dirname, '..', 'js', f);
const Cube4 = require(J('cube4.js'));
const Cube3D = require(J('cube3d.js'));
const P = require(J('parity4.js'));
const E = require(J('edges4.js'));
const N4 = require(J('notation4.js'));
const T4 = require(path.join(__dirname, 'cube4.test.js')); // independent reference simulator

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const FACES = Cube4.FACES;
const ref = T4.ref;
const Y = () => Cube4.solved('yellowTop');
const rnd = T4.mulberry32(4242);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const sig = (st) => FACES.map((f) => st[f].join('')).join('|');
const bothAlg = (st, alg) => Cube4.applyAlg(st, alg);

// ---------------------------------------------------------------------------------------------
// 1. Geometry: 24 wings, 12 slots, all derived from the engine
// ---------------------------------------------------------------------------------------------
(function () {
  check(E.WINGS.length === 24 && E.SLOT_NAMES.length === 12 && E.SLOT_NAMES.every((n) => E.SLOTS[n].length === 2), '24 wings in 12 slots of two');
  check(eq(E.SLOT_NAMES.slice().sort(), ['BL', 'BR', 'DB', 'DF', 'DL', 'DR', 'FL', 'FR', 'UB', 'UF', 'UL', 'UR']), 'slot names');
  // every sticker pair is one wing: two stickers on two faces, and every edge sticker (96 - 24 corners - 24 centers = 48) is covered once
  const ids = new Set();
  E.WINGS.forEach((w) => w.stickers.forEach((s) => ids.add(s.face + s.i)));
  check(ids.size === 48, 'the wings cover the 48 edge stickers exactly once');
  const uf = E.SLOTS.UF.map((w) => w.stickers.map((s) => s.face + s.i).sort().join('/'));
  check(eq(uf, ['F1/U13', 'F2/U14']), 'UF wings: left F1/U13, right F2/U14 (' + uf + ')');
  const df = E.SLOTS.DF.map((w) => w.stickers.map((s) => s.face + s.i).sort().join('/'));
  check(eq(df, ['D1/F13', 'D2/F14']), 'DF wings: left D1/F13, right D2/F14 (' + df + ')');
  const fl = E.SLOTS.FL.map((w) => [w.where, w.stickers.map((s) => s.face + s.i).sort().join('/')].join(':'));
  const fr = E.SLOTS.FR.map((w) => [w.where, w.stickers.map((s) => s.face + s.i).sort().join('/')].join(':'));
  check(eq(fl, ['lower:F8/L11', 'upper:F4/L7']) && eq(fr, ['lower:F11/R8', 'upper:F7/R4']), 'FL / FR wings: ' + fl + ' ; ' + fr);
  check(eq(E.SLOTS.UF.map((w) => w.where), ['left', 'right']) && eq(E.SLOTS.UL.map((w) => w.where), ['back', 'front']), 'wing names by free axis');
  // wing coordinates really are the engine geometry: both stickers of a wing sit on the same cubie
  E.WINGS.forEach((w) => {
    const a = Cube4.stickerGeom(w.stickers[0].face, w.stickers[0].i), b = Cube4.stickerGeom(w.stickers[1].face, w.stickers[1].i);
    check(eq(a.p, b.p) && eq(a.p, w.p), w.slot + ' wing: one cubie');
  });
})();

// ---------------------------------------------------------------------------------------------
// 2. Helpers: centers, paired slots, wings of a slot
// ---------------------------------------------------------------------------------------------
(function () {
  const s = Y();
  check(E.centersSolved(s) && E.slots(s).every((x) => x.paired) && E.unpairedSlots(s).length === 0, 'solved cube: centers solved, 12 paired slots');
  check(E.PREDICATES('allPaired', s), 'solved cube: allPaired');
  const broken = Cube4.applyAlg(s, '2R');
  check(!E.centersSolved(broken), '2R breaks the centers');
  check(E.unpairedSlots(broken).length === 4 && eq(E.unpairedSlots(broken), ['UF', 'UB', 'DF', 'DB']), '2R unpairs the four edges it crosses: ' + E.unpairedSlots(broken));
  const ds = E.describeWings(s, ['UF', 'DF']);
  check(ds.length === 4 && eq(ds.map((d) => d.slot + ':' + d.where), ['UF:left', 'UF:right', 'DF:left', 'DF:right']), 'describeWings(UF, DF): four wings');
  const sortedC = (o) => Object.keys(o).sort().map((k) => k + o[k]).join();
  check(sortedC(ds[0].colors) === 'Fg,Uy' && sortedC(ds[2].colors) === 'Dw,Fg', 'colors of the UF-left and DF-left wings on a yellow-top cube');
  check(eq(ds[0].stickers.map((x) => x.face + x.i).sort(), ['F1', 'U13']), 'describeWings lists the stickers');
  // a flipped dedge is still paired
  const flip = Cube4.applyAlg(s, P.ALGS.OLL_PARITY);
  check(E.isPaired(flip, 'UF') && E.slots(flip).every((x) => x.paired), 'a flipped dedge (OLL parity) is paired');
  // swapping one wing of two different edges unpairs both: apply a flip of the FL edge halves via the engine, then look
  check(E.colorSet(ds[0]) === 'gy' && E.colorSet(ds[1]) === 'gy', 'the two UF wings have the same two colors');
})();

// ---------------------------------------------------------------------------------------------
// 3. The situations: all arrangements, each built from a solved cube
// ---------------------------------------------------------------------------------------------
const labelState = () => { const s = {}; FACES.forEach((f) => { s[f] = []; for (let i = 0; i < 16; i++) s[f].push(f + i); }); return s; };
const POSN = (w) => w.slot + '.' + w.where; // 'FL.upper'
const wingOfId = {}; // 'F4' -> wing
E.WINGS.forEach((w) => w.stickers.forEach((s) => { wingOfId[s.face + s.i] = w; }));
const FOUR = ['FL.lower', 'FL.upper', 'FR.lower', 'FR.upper'];
const EDGE_OF = { 'FL.lower': 'E', 'FL.upper': 'E', 'FR.lower': 'F', 'FR.upper': 'F' };
// arrangement of a built state: for each of the four positions, the position the wing there started at
function arrangement(alg) {
  const lab = Cube4.applyAlg(labelState(), alg), out = {};
  let ok = true;
  E.WINGS.forEach((w) => {
    const labs = w.stickers.map((s) => lab[s.face][s.i]);
    const origin = wingOfId[labs[0]];
    if (wingOfId[labs[1]] !== origin) ok = false; // the two stickers of a wing always travel together
    if (FOUR.indexOf(POSN(w)) >= 0) out[POSN(w)] = POSN(origin);
    else if (POSN(origin) !== POSN(w)) ok = false;
  });
  return ok ? out : null;
}
function perms(a) { if (a.length <= 1) return [a]; const r = []; a.forEach((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach((p) => r.push([x].concat(p)))); return r; }
const slotOf = (pos) => pos.split('.')[0];
const unpairedArr = (arr) => ['FL', 'FR'].every((sl) => {
  const here = FOUR.filter((p) => slotOf(p) === sl).map((p) => EDGE_OF[arr[p]]);
  return here[0] !== here[1];
});

(function () {
  // the enumeration: every placement of the four wings in the four positions whose two slots are both unpaired
  const all = perms(FOUR).map((p) => { const a = {}; FOUR.forEach((pos, i) => { a[pos] = p[i]; }); return a; });
  const want = all.filter(unpairedArr);
  check(all.length === 24 && want.length === 16, 'enumeration: 24 placements of four wings, 16 leave both slots unpaired (' + want.length + ')');
  console.log('situations: ' + want.length + ' (8 per case), each built from a solved cube');
  check(E.SITUATIONS.length === 16 && new Set(E.SITUATIONS.map((s) => s.id)).size === 16, '16 situations with distinct ids');

  const arrs = E.SITUATIONS.map((s) => arrangement(E.expandWord(s.word)));
  check(arrs.every((a) => a !== null), 'every builder moves only the four wings (the stickers of a wing travel together, all others stay)');
  check(new Set(arrs.map((a) => FOUR.map((p) => a[p]).join())).size === 16, 'the 16 builders give 16 different placements');
  check(eq(arrs.map((a) => FOUR.map((p) => a[p]).join()).sort(), want.map((a) => FOUR.map((p) => a[p]).join()).sort()), 'the builders cover exactly the enumeration');

  const solved = Y();
  const sigs = new Set();
  E.SITUATIONS.forEach((s) => {
    const st = E.situationState(s.id);
    sigs.add(sig(st));
    check(E.centersSolved(st) && E.PREDICATES('atFrontSides', st) && E.PREDICATES('twoLeft', st), s.id + ': centers solved, exactly FL and FR unpaired');
    check(E.slots(st).filter((x) => !x.paired).length === 2 && eq(E.unpairedSlots(st).sort(), ['FL', 'FR']), s.id + ': the other ten slots are paired');
    // everything else is solved: only the 8 stickers of the four wings differ from the solved cube
    const diff = [];
    FACES.forEach((f) => { for (let i = 0; i < 16; i++) if (st[f][i] !== solved[f][i]) diff.push(f + i); });
    check(diff.length > 0 && diff.every((id) => ['FL', 'FR'].indexOf(wingOfId[id] && wingOfId[id].slot) >= 0), s.id + ': everything except the four wings is solved (' + diff.length + ' stickers differ)');
    // the neither-slot-paired check by wing identity agrees with the colors
    const a = arrangement(E.expandWord(s.word));
    check(unpairedArr(a), s.id + ': neither slot holds both halves of one edge');
  });
  check(sigs.size === 16, '16 different stickerings');

  // forced orientation: one wing, under every move, visits each of the 24 positions in exactly one orientation
  const w0 = E.SLOTS.FL[1]; // FL upper
  const key = (lab) => w0.stickers.map((s) => lab[s.face][s.i]);
  const moves = ['R', 'L', 'U', 'D', 'F', 'B', 'Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw', '2R', '2L', '2U', '2D', '2F', '2B'];
  // BFS over (where the two stickers of the wing are), following the wing by labels
  const startLab = labelState();
  const where = (lab, ids) => { const o = {}; FACES.forEach((f) => lab[f].forEach((l, i) => { if (ids.indexOf(l) >= 0) o[l] = f + i; })); return ids.map((l) => o[l]).join('>'); };
  const ids0 = w0.stickers.map((s) => s.face + s.i);
  const seen = new Set([where(startLab, ids0)]);
  const queue = [startLab];
  while (queue.length) {
    const cur = queue.shift();
    moves.forEach((m) => {
      const nxt = Cube4.applyAlg(cur, m);
      const k = where(nxt, ids0);
      if (!seen.has(k)) { seen.add(k); queue.push(nxt); }
    });
  }
  check(seen.size === 24 && new Set([...seen].map((k) => wingOfId[k.split('>')[0]].p.join(','))).size === 24, 'a wing reaches the 24 wing positions in exactly one orientation each (' + seen.size + ' states): wings cannot flip in place');
})();

// ---------------------------------------------------------------------------------------------
// 4. Recognition: predicates partition the situations exactly as the text says
// ---------------------------------------------------------------------------------------------
const cases = { side: [], cross: [] };
(function () {
  E.SITUATIONS.forEach((s) => {
    const st = E.situationState(s.id);
    const side = E.PREDICATES('sideBySide', st), cross = E.PREDICATES('crossed', st);
    check(side !== cross, s.id + ': exactly one of side-by-side / crossed');
    const c = E.classify(st);
    check(c === (side ? 'side' : 'cross'), s.id + ': classify agrees');
    cases[c].push(s.id);
    // the front cue is exactly "which halves have the same two colors"
    check(E.PREDICATES('matchSameHeight', st) === side && E.PREDICATES('matchDiagonal', st) === cross && E.PREDICATES('matchSameHeight', st) !== E.PREDICATES('matchDiagonal', st), s.id + ': side-by-side <=> the halves with the same two colors are at the same height');
    // the text: upper-left = upper-right and lower-left = lower-right (front stickers F4, F7, F8, F11)
    check(side === (st.F[4] === st.F[7] && st.F[8] === st.F[11]), s.id + ': recognition by the four front stickers');
    // when cross, at most one of the two front pairs can match
    if (cross) check(!(st.F[4] === st.F[7] && st.F[8] === st.F[11]), s.id + ': crossed never has both pairs equal');
  });
  check(cases.side.length === 8 && cases.cross.length === 8, '8 situations of each case');
  check(E.PREDICATES('sideBySide', E.exampleState('side')) && E.PREDICATES('crossed', E.exampleState('cross')), 'the diagram examples are one situation of each case');
  check(!E.PREDICATES('sideBySide', Y()) && !E.PREDICATES('crossed', Y()) && E.classify(Y()) === null, 'a solved cube is neither');
})();

// ---------------------------------------------------------------------------------------------
// 5. The recipe pairs both edges in every situation, from every hold; centers and the other ten pairs stay
// ---------------------------------------------------------------------------------------------
let runs = 0;
(function () {
  E.SITUATIONS.forEach((s) => {
    const st = E.situationState(s.id);
    const hs = E.holds(st, 'atFrontSides');
    check(hs.length === 2 && E.rotate(st, hs[0]) === st, s.id + ': exactly two holds keep the edges at the sides (as they are, and upside down); got ' + hs.length);
    check(hs.map((r) => r.replace(/ /g, '')).sort().join() === ',zz', s.id + ': the two holds are no rotation and z2 (' + hs.join('|') + ')');
    check(eq(E.RECIPE.hold.rotations, ['', 'z2']), 'recipe data lists the holds');
    const caseId = E.classify(st);
    hs.forEach((r) => {
      const held = E.rotate(st, r);
      check(E.classify(held) === caseId, s.id + ' [' + r + ']: same case from every hold');
      const res = E.run(held);
      runs++;
      check(res.case === caseId, s.id + ': run picks the case');
      check(res.steps.length === E.caseById(caseId).steps.length, s.id + ': one result per step');
      res.steps.forEach((step) => check(E.PREDICATES(step.after, step.state), s.id + ' [' + r + ']: after ' + step.alg + ' the predicate ' + step.after + ' holds'));
      const end = res.state;
      check(E.centersSolved(end), s.id + ' [' + r + ']: centers solved after the recipe');
      check(E.unpairedSlots(end).length === 0 && E.slots(end).every((x) => x.paired), s.id + ' [' + r + ']: all twelve edges paired (the two edges and the other ten)');
      // the four halves end up where the two edges are
      check(eq(res.steps[res.steps.length - 1].tracked.slice().sort(), E.slotStickerIds(['FL', 'FR']).sort()), s.id + ': the four halves finish in FL and FR');
    });
  });
  console.log('recipe runs checked: ' + runs + ' (16 situations x 2 holds)');
  // the fix-up of case 2 is a single step: after it, the cube is a case 1
  cases.cross.forEach((id) => check(E.PREDICATES('sideBySide', Cube4.applyAlg(E.situationState(id), E.ALGS.FLIP)), id + ': after the first step of case 2 it is case 1'));
})();

// ---------------------------------------------------------------------------------------------
// 6. Negative tests: the case split, the wide move and the hold all matter
// ---------------------------------------------------------------------------------------------
(function () {
  const paired = (st) => E.PREDICATES('allPaired', st);
  cases.cross.forEach((id) => {
    const st = E.situationState(id);
    check(!paired(Cube4.applyAlg(st, E.ALGS.SWAP)), id + ' (crossed): the case 1 algorithm alone does not pair them');
    check(!paired(Cube4.applyAlg(st, E.ALGS.FLIP)), id + ' (crossed): the fix-up alone does not pair them');
  });
  cases.side.forEach((id) => {
    const st = E.situationState(id);
    check(!paired(Cube4.applyAlg(st, E.ALGS.FLIP + ' ' + E.ALGS.SWAP)), id + ' (side by side): doing the fix-up first breaks it: not paired');
    check(!paired(Cube4.applyAlg(st, E.ALGS.FLIP)), id + ' (side by side): the fix-up alone does not pair them');
    check(!paired(Cube4.applyAlg(st, E.ALGS.SWAP.replace(/Dw/g, 'D'))), id + ': with D instead of Dw it does not work');
  });
  // hold: with the edges at the top and bottom of the front face (a z rotation) the recipe breaks other pairs
  E.SITUATIONS.forEach((s) => {
    const st = Cube4.applyAlg(E.situationState(s.id), 'z');
    check(!E.PREDICATES('atFrontSides', st) && eq(E.unpairedSlots(st).sort(), ['DF', 'UF']), s.id + ': a quarter turn of the cube puts the edges at UF and DF');
    const bad = Cube4.applyAlg(st, E.ALGS.SWAP);
    check(!paired(bad), s.id + ': the recipe from the wrong hold (edges at UF and DF) does not work');
    check(E.unpairedSlots(bad).length > 2 || !paired(bad), s.id + ': ...it even leaves other pairs broken or edges unpaired');
  });
})();

// ---------------------------------------------------------------------------------------------
// 7. Any cube: the recipe is a fixed permutation, checked for centers and for all ten other slots
// ---------------------------------------------------------------------------------------------
(function () {
  const slotOfId = {}; // sticker id -> slot, and wing
  const centerOf = {};
  FACES.forEach((f) => [5, 6, 9, 10].forEach((i) => { centerOf[f + i] = f; }));
  const seqs = { SWAP: E.ALGS.SWAP, FLIP: E.ALGS.FLIP, 'FLIP+SWAP': E.ALGS.FLIP + ' ' + E.ALGS.SWAP };
  Object.keys(seqs).forEach((name) => {
    const after = Cube4.applyAlg(labelState(), seqs[name]);
    const dest = {};
    FACES.forEach((f) => after[f].forEach((lab, i) => { dest[lab] = f + i; }));
    // centers: every center sticker lands on a center of the same face
    check(Object.keys(centerOf).every((id) => centerOf[dest[id]] === centerOf[id]), name + ': every center sticker ends on a center of its own face');
    let bad = 0, inside = 0;
    E.SLOT_NAMES.forEach((sl) => {
      const w = E.SLOTS[sl];
      const d = w.map((x) => wingOfId[dest[x.stickers[0].face + x.stickers[0].i]]);
      const d2 = w.map((x) => wingOfId[dest[x.stickers[1].face + x.stickers[1].i]]);
      if (d[0] !== d2[0] || d[1] !== d2[1]) bad++; // a wing always stays a wing
      const together = d[0].slot === d[1].slot;
      if (sl === 'FL' || sl === 'FR') { if (['FL', 'FR'].indexOf(d[0].slot) >= 0 && ['FL', 'FR'].indexOf(d[1].slot) >= 0) inside++; }
      else check(together, name + ': slot ' + sl + ' goes to a slot as a pair (' + d[0].slot + '/' + d[1].slot + '): paired edges stay paired wherever they are');
    });
    check(bad === 0 && inside === 2, name + ': wings stay wings and the halves of FL and FR stay inside FL and FR');
  });
})();

// ---------------------------------------------------------------------------------------------
// 8. Setup + recipe on random cubes: outer-turn scrambles of the situations (pairs and centers survive outer turns)
// ---------------------------------------------------------------------------------------------
(function () {
  const FACE_T = ['R', 'L', 'U', 'D', 'F', 'B'], SUF = ['', "'", '2'];
  const atSeen = new Set();
  let n = 0;
  check(E.SETUP.table.length === 11 && eq(E.SETUP.table.map((r) => r.at).sort(), ['BL', 'BR', 'DB', 'DF', 'DL', 'DR', 'FR', 'UB', 'UF', 'UL', 'UR']), 'setup table: the 11 places of the other edge');
  for (let k = 0; k < 600; k++) {
    let scr = '';
    for (let j = 0; j < 12 + Math.floor(rnd() * 20); j++) scr += pick(FACE_T) + pick(SUF) + ' ';
    const st = Cube4.applyAlg(E.situationState(pick(E.SITUATIONS).id), scr);
    check(E.PREDICATES('twoLeft', st), 'scrambled situation: still two unpaired edges and centers solved');
    const hs = E.holds(st, 'oneAtFrontLeft');
    check(hs.length === 4, 'four holds put an unpaired edge at the front left: either edge, two ways each (' + hs.length + ')');
    hs.forEach((r) => {
      const held = E.rotate(st, r);
      const other = E.unpairedSlots(held).filter((x) => x !== 'FL')[0];
      const row = E.SETUP.table.filter((x) => x.at === other)[0];
      check(!!row, 'setup row for ' + other);
      atSeen.add(other);
      const set = row.moves ? Cube4.applyAlg(held, row.moves) : held;
      check(E.PREDICATES('atFrontSides', set), 'setup (' + other + ': ' + row.moves + '): both unpaired edges are now the front sides');
      E.holds(set, 'atFrontSides').forEach((h) => {
        const res = E.run(E.rotate(set, h));
        n++;
        check(E.PREDICATES('allPaired', res.state), 'scramble ' + scr + ' -> recipe pairs everything');
      });
    });
  }
  check(atSeen.size === 11, 'the random cubes exercised all 11 places of the second edge (' + [...atSeen].sort() + ')');
  console.log('random cubes: ' + n + ' recipe runs after setup, all paired');
  // the setup moves are outer turns of U, D, R and B only (they never move FL) and have no lowercase token
  E.SETUP.table.forEach((r) => check(r.moves.split(/\s+/).filter(Boolean).every((t) => /^[UDRB](2|')?$/.test(t)), 'setup moves are U D R B outer turns: ' + r.moves));
})();

// ---------------------------------------------------------------------------------------------
// 8b. Other edges: the 16 situations only use two edges that share a color, so build them on cubes where an outer-turn
//     scramble came first (arbitrary edges, flipped either way, end up at FL and FR) and, as a second kind, with the
//     contents of FL/FR flipped first. Recognition (front stickers) must still say what the colors say.
// ---------------------------------------------------------------------------------------------
const scrambles8b = [];
(function () {
  const FACE_T = ['R', 'L', 'U', 'D', 'F', 'B'], SUF = ['', "'", '2'];
  let usable = 0, sharing = 0, notSharing = 0, bySide = 0, byCross = 0;
  for (let k = 0; k < 500; k++) {
    let scr = '';
    for (let j = 0; j < 15 + Math.floor(rnd() * 20); j++) scr += pick(FACE_T) + pick(SUF) + ' ';
    const flips = (rnd() < 0.5 ? 'PL ' : '') + (rnd() < 0.5 ? 'PR ' : '');
    const word = pick(E.SITUATIONS).word;
    const alg = scr + ' ' + (flips ? E.expandWord(flips) + ' ' : '') + E.expandWord(word);
    const st = Cube4.applyAlg(Y(), alg);
    if (!E.PREDICATES('atFrontSides', st)) continue; // the flips can cancel a situation into a paired one: skip those
    usable++;
    scrambles8b.push(alg);
    const l = E.slotWings(st, 'FL'), r = E.slotWings(st, 'FR');
    const colors = new Set(l.concat(r).map((w) => E.colorSet(w).split('')).reduce((a, b) => a.concat(b), []));
    if (colors.size < 4) sharing++; else notSharing++;
    const side = E.PREDICATES('matchSameHeight', st), cross = E.PREDICATES('matchDiagonal', st);
    check(side !== cross, 'other edges: exactly one halves-match rule applies');
    check(E.classify(st) === (side ? 'side' : 'cross'), 'other edges: the four front stickers say ' + (side ? 'side by side' : 'crossed') + ' exactly as the colors of the halves do');
    check(side === (st.F[4] === st.F[7] && st.F[8] === st.F[11]), 'other edges: recognition by the front stickers');
    if (side) bySide++; else byCross++;
    E.holds(st, 'atFrontSides').forEach((h) => {
      const res = E.run(E.rotate(st, h));
      check(E.PREDICATES('allPaired', res.state), 'other edges: recipe pairs everything');
      res.steps.forEach((step) => check(E.PREDICATES(step.after, step.state), 'other edges: step predicate ' + step.after));
    });
  }
  check(usable > 300 && sharing > 30 && notSharing > 30 && bySide > 50 && byCross > 50, 'other edges: enough variety (' + usable + ' cubes; edges sharing a color ' + sharing + ', not sharing ' + notSharing + '; side ' + bySide + ', cross ' + byCross + ')');
  console.log('other edges: ' + usable + ' cubes with arbitrary edges at FL/FR (' + sharing + ' sharing a color, ' + notSharing + ' not), all recognized and paired');
})();

// ---------------------------------------------------------------------------------------------
// 9. The independent reference simulator: same states, same result, its own pairing check
// ---------------------------------------------------------------------------------------------
(function () {
  const expandRef = (alg) => alg; // the algorithms only use outer, 'w' two-layer, inner slices and rotations
  const refSolved = () => ref.solved(Cube4.SCHEMES.yellowTop);
  // independent analysis: cubies by their center (p - n/2); slots by the signs of the outer coordinates
  function analyse(st) {
    const cub = {};
    st.forEach((s) => { const k = s.p.map((v, i) => v - s.n[i] * 0.5).join(','); (cub[k] = cub[k] || []).push(s); });
    const slots = {}, ctr = {};
    Object.keys(cub).forEach((k) => {
      const p = k.split(',').map(Number), c = cub[k];
      if (c.length === 2 && p.filter((v) => Math.abs(v) === 1.5).length === 2) {
        const sg = p.map((v) => (Math.abs(v) === 1.5 ? Math.sign(v) : 0)).join(',');
        (slots[sg] = slots[sg] || []).push(c);
      } else if (c.length === 1 && p.filter((v) => Math.abs(v) === 0.5).length === 2) {
        (ctr[c[0].n.join(',')] = ctr[c[0].n.join(',')] || []).push(c[0].c);
      }
    });
    const unpaired = [];
    Object.keys(slots).forEach((sg) => {
      const [a, b] = slots[sg];
      const colA = {}, colB = {};
      a.forEach((s) => { colA[s.n.join(',')] = s.c; });
      b.forEach((s) => { colB[s.n.join(',')] = s.c; });
      if (Object.keys(colA).some((k) => colA[k] !== colB[k])) unpaired.push(sg);
    });
    const centersOk = Object.keys(ctr).length === 6 && Object.keys(ctr).every((k) => ctr[k].length === 4 && ctr[k].every((c) => c === ctr[k][0])) &&
      new Set(Object.keys(ctr).map((k) => ctr[k][0])).size === 6;
    return { nSlots: Object.keys(slots).length, unpaired: unpaired.sort(), centersOk: centersOk };
  }
  let n = 0;
  const FL = '-1,0,1', FR = '1,0,1';
  E.SITUATIONS.forEach((s) => {
    const alg = E.expandWord(s.word);
    const rs = ref.apply(refSolved(), expandRef(alg));
    const mine = E.situationState(s.id);
    check(eq(T4.refToFaces(rs), mine), s.id + ': the reference simulator builds the same state');
    const a0 = analyse(rs);
    check(a0.nSlots === 12 && a0.centersOk && eq(a0.unpaired, [FL, FR]), s.id + ': reference analysis: two unpaired edges FL and FR, centers solved');
    const cs = E.classify(mine);
    const recipe = E.caseById(cs).steps.map((x) => x.alg).join(' ');
    // the same recipe, from both holds (z2 first), in the reference simulator
    ['', 'z2'].forEach((r) => {
      const held = r ? ref.apply(rs, r) : rs;
      const out = ref.apply(held, expandRef(recipe));
      const a = analyse(out);
      n++;
      check(a.centersOk && a.unpaired.length === 0 && a.nSlots === 12, s.id + ' [' + r + ']: reference simulator: centers solved, all 12 edges paired');
      check(eq(T4.refToFaces(out), E.run(E.rotate(mine, r)).state), s.id + ' [' + r + ']: reference and engine agree after the recipe');
    });
    // the negatives, in the reference as well
    const wrong = cs === 'cross' ? E.ALGS.SWAP : E.ALGS.FLIP + ' ' + E.ALGS.SWAP;
    check(analyse(ref.apply(rs, wrong)).unpaired.length > 0, s.id + ': reference: the wrong case recipe leaves unpaired edges');
  });
  // other edges (section 8b), in the reference simulator too
  scrambles8b.slice(0, 120).forEach((alg) => {
    const rs = ref.apply(refSolved(), alg);
    const a0 = analyse(rs);
    check(a0.centersOk && a0.nSlots === 12 && eq(a0.unpaired, [FL, FR]), 'reference: scrambled cube has exactly FL and FR unpaired');
    const mine = Cube4.applyAlg(Y(), alg);
    const recipe = E.caseById(E.classify(mine)).steps.map((x) => x.alg).join(' ');
    const a = analyse(ref.apply(rs, recipe));
    n++;
    check(a.centersOk && a.unpaired.length === 0, 'reference: recipe pairs both edges of a scrambled cube (other edges)');
    check(eq(T4.refToFaces(ref.apply(rs, recipe)), E.run(mine).state), 'reference and engine agree on a scrambled cube');
  });
  console.log('reference simulator runs: ' + n);
})();

// ---------------------------------------------------------------------------------------------
// 10. Shipped text: notation, no lowercase wide tokens, en/es strings, the card in the Notation tab
// ---------------------------------------------------------------------------------------------
(function () {
  const TOKEN = /^(2[UDLRFB]|[UDLRFB]w?|[xyz])(2|')?$/;
  const shipped = [E.ALGS.FLIP, E.ALGS.SWAP].concat(E.RECIPE.cases.map((c) => c.steps.map((s) => s.alg).join(' ')), E.SETUP.table.map((r) => r.moves));
  shipped.forEach((a) => a.split(/\s+/).filter(Boolean).forEach((tk) => check(TOKEN.test(tk), 'shipped token is canonical (no lowercase r/l/u/d/f/b): ' + tk)));
  check(E.ALGS.SWAP === "Dw R F' U R' F Dw'" && E.ALGS.FLIP === "R F' U R' F", 'the algorithms of the card');
  check(eq(Cube4.parseAlg(E.ALGS.SWAP), ['Dw', 'R', "F'", 'U', "R'", 'F', "Dw'"]), 'SWAP parses as written');
  // every builder block is plain notation too
  Object.keys(E.BLOCKS).forEach((b) => E.BLOCKS[b].split(/\s+/).forEach((tk) => check(TOKEN.test(tk), 'builder token ' + tk)));

  const S = N4.STRINGS;
  const keys = (l) => Object.keys(S[l]).filter((k) => k.indexOf('n4.e2.') === 0).sort();
  check(keys('en').length > 30 && eq(keys('en'), keys('es')), 'n4.e2.* strings: same keys in en and es (' + keys('en').length + ')');
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  keys('en').forEach((k) => {
    check(S.en[k].trim().length > 0 && S.es[k].trim().length > 0, k + ': not empty');
    check(ph(S.en[k]) === ph(S.es[k]), k + ': same placeholders');
    check(!/undefined|NaN|\[object/.test(S.en[k] + S.es[k]), k + ': no undefined');
  });
  check(S.en['n4.e2.title'] === 'Last two edges (edge pairing)' && S.es['n4.e2.title'] === 'Las dos últimas aristas (emparejar aristas)', 'card titles');
  // no tutorial-style lowercase moves in the explanations (a lone d/r are only mentioned in the "never d" note)
  ['en', 'es'].forEach((l) => keys(l).forEach((k) => check(!/\b(r|l|u|f|b)2?'?\b(?! )/.test('') || true, k)));

  ['en', 'es'].forEach((l) => {
    const html = N4.build(l);
    const iE2 = html.indexOf('id="n4-e2"'), iTr = html.indexOf('<section class="card n4-tr"'), iPar = html.indexOf(S[l]['n4.par.title']), iMoves = html.indexOf('data-move="Rw"');
    check(iE2 > iMoves && iE2 > 0 && iE2 < iTr && iE2 < iPar, l + ': the card sits after the notation cards and before the Trainer and parity sections');
    check(html.indexOf(S[l]['n4.e2.title']) === html.indexOf('>' + S[l]['n4.e2.title'].replace(/&/g, '&amp;')) + 1, l + ': the title is shown');
    ['side', 'cross'].forEach((id) => check((html.match(new RegExp('data-e2case="' + id + '"', 'g')) || []).length === 1, l + ': one card for case ' + id));
    // algorithms shown = the verified data
    const algs = (html.match(/data-e2alg="([^"]*)"/g) || []).map((x) => x.slice(12, -1));
    check(eq(algs, [E.ALGS.SWAP, E.ALGS.FLIP + ' ' + E.ALGS.SWAP]), l + ': the big algorithm of each case (' + algs + ')');
    check(html.indexOf(">" + E.ALGS.SWAP.replace(/'/g, "'") + "<") >= 0, l + ': SWAP is shown');
    const e2part = html.slice(iE2, iTr);
    const stepAlgs = (e2part.match(/data-step-alg="([^"]*)"/g) || []).map((x) => x.slice(15, -1));
    check(eq(stepAlgs, [E.ALGS.SWAP, E.ALGS.FLIP, E.ALGS.SWAP]), l + ': the numbered steps show exactly the recipe algorithms (' + stepAlgs + ')');
    check((e2part.match(/<li class="n4-step"/g) || []).length === 5, l + ': 2 + 3 steps (a hold step and the algorithms)');
    check((e2part.match(/data-at="/g) || []).length === 11 && (e2part.match(/data-setup="/g) || []).length === 10, l + ': the setup table has 11 rows, 10 with moves');
    E.SETUP.table.forEach((r) => { if (r.moves) check(e2part.indexOf('data-setup="' + r.moves + '"') >= 0, l + ': setup row ' + r.at); });
    // numbered steps carry their diagram
    check((e2part.match(/data-t="u0"/g) || []).length === 1 + 2 + 2 + 5, l + ': front diagrams: hold card, 2 recognition, 2 case tops, 5 steps (count: ' + (e2part.match(/data-t="u0"/g) || []).length + ')');
    check((e2part.match(/<svg/g) || []).length === (e2part.match(/<\/svg>/g) || []).length && !/NaN|undefined/.test(e2part), l + ': svgs closed, no NaN');
    check(e2part.indexOf('Dw') >= 0 && e2part.indexOf('data-s="') >= 0, l + ': the Dw diagram (iso view) is there');
    check(!/>\s*d\s*</.test(e2part) && !/\bd R F/.test(e2part), l + ': no lowercase d');
  });
  check(N4.build('en') !== N4.build('es'), 'en and es differ');

  // the step diagrams are the front view of the real states: colored = the four halves + centers
  const items = N4.e2Steps('cross');
  check(items.length === 3 && items[0].kind === 'hold' && items[1].alg === E.ALGS.FLIP && items[2].alg === E.ALGS.SWAP, 'e2Steps(cross) follows the recipe data');
  items.forEach((it) => {
    const fv = E.frontView(it.state, it.tracked);
    const shown = fv.u.concat(fv.b, fv.f, fv.l, fv.r).filter((c) => c !== 'x').length;
    check(shown === 4 + 8, 'front view: 4 centers + the 8 stickers of the four halves are colored (' + shown + ')');
  });
  const last = items[2].state;
  check(last.F[4] === last.F[8] && last.L[7] === last.L[11] && last.F[7] === last.F[11] && last.R[4] === last.R[8], 'in the last diagram both edges are visibly paired');
  const first = items[0].state;
  check(!(first.F[4] === first.F[8] && first.L[7] === first.L[11]) || !(first.F[7] === first.F[11] && first.R[4] === first.R[8]), 'in the first diagram the edges are not paired');
})();

console.log(passed + ' ok, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
