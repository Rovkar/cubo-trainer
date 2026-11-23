(function (root) {
  'use strict';

  // 4x4: the last two edges of the reduction stage (edge pairing).
  // Data and helpers, machine-checkable (tests/edges4.test.js, against js/cube4.js and an independent simulator):
  //   - the geometry of the 12 dedge slots and their 24 wings (derived from Cube4.stickerGeom, never by hand),
  //   - helpers: centers solved, which slots are paired, the wings of a slot,
  //   - the 16 real situations of "two unpaired edges at the left and right of the front face", each built from a
  //     solved cube by a move sequence (so every one of them is reachable),
  //   - the recipe (hold, recognition predicates, algorithms), the setup that brings any two edges to the front.
  // Situation: the centers are solved, ten dedges are paired (they may be anywhere) and the other two are not. Each of the
  // two unpaired slots then holds one half (wing) of each of two edges; the corners and the 3x3 positions do not matter.
  var isNode = typeof module !== 'undefined' && module.exports;
  var Cube4 = isNode ? require('./cube4.js') : root.Cube4;
  var Parity4 = isNode ? require('./parity4.js') : root.Parity4;

  var FACE_ORDER = 'UDFBRL';
  var SLOT_NAMES = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'];
  var CENTER_IDX = [5, 6, 9, 10];
  var FREE_NAMES = [['left', 'right'], ['lower', 'upper'], ['back', 'front']]; // by free axis x, y, z; coordinate order

  // ---- Geometry: wings and slots ----
  var WINGS = [];
  (function () {
    var byCubie = {};
    Cube4.FACES.forEach(function (face) {
      for (var i = 0; i < Cube4.N * Cube4.N; i++) {
        var g = Cube4.stickerGeom(face, i), key = g.p.join(',');
        (byCubie[key] = byCubie[key] || []).push({ face: face, i: i, p: g.p });
      }
    });
    Object.keys(byCubie).forEach(function (key) {
      var st = byCubie[key], p = st[0].p;
      var outer = p.filter(function (v) { return Math.abs(v) === 1.5; }).length;
      if (st.length !== 2 || outer !== 2) return; // an edge wing: two stickers, on two outer coordinates
      var free = p.map(function (v) { return Math.abs(v) === 0.5; }).indexOf(true);
      var faces = st.map(function (s) { return s.face; }).sort(function (a, b) { return FACE_ORDER.indexOf(a) - FACE_ORDER.indexOf(b); });
      WINGS.push({
        slot: faces.join(''), faces: faces, p: p, axis: free,
        where: FREE_NAMES[free][p[free] < 0 ? 0 : 1],
        stickers: st.map(function (s) { return { face: s.face, i: s.i }; }),
      });
    });
  })();
  var SLOTS = {};
  SLOT_NAMES.forEach(function (n) { SLOTS[n] = []; });
  WINGS.forEach(function (w) {
    if (!SLOTS[w.slot]) throw new Error('Unexpected slot ' + w.slot);
    SLOTS[w.slot].push(w);
  });
  SLOT_NAMES.forEach(function (n) {
    SLOTS[n].sort(function (a, b) { return a.p[a.axis] - b.p[b.axis]; });
    if (SLOTS[n].length !== 2) throw new Error('Slot ' + n + ' needs two wings');
  });
  function stickerOf(w, face) {
    for (var k = 0; k < 2; k++) if (w.stickers[k].face === face) return w.stickers[k];
    throw new Error('No ' + face + ' sticker');
  }

  // ---- Helpers on a state ----
  // all 24 center stickers solved: the four of every face share a color and the six colors are different
  function centersSolved(state) {
    var seen = {};
    return Cube4.FACES.every(function (f) {
      var c = state[f][CENTER_IDX[0]];
      if (seen[c]) return false;
      seen[c] = true;
      return CENTER_IDX.every(function (i) { return state[f][i] === c; });
    });
  }
  // wing -> {slot, where, colors: {face: color}}
  function wingInfo(state, w) {
    var colors = {};
    w.stickers.forEach(function (s) { colors[s.face] = state[s.face][s.i]; });
    return { slot: w.slot, where: w.where, stickers: w.stickers.map(function (s) { return { face: s.face, i: s.i, color: state[s.face][s.i] }; }), colors: colors };
  }
  // the two wings of a slot, in coordinate order (left, right / lower, upper / back, front)
  function slotWings(state, slot) {
    if (!SLOTS[slot]) throw new Error('Unknown slot ' + slot);
    return SLOTS[slot].map(function (w) { return wingInfo(state, w); });
  }
  // paired: both wings show the same color on each of the two faces of the slot
  function isPaired(state, slot) {
    var w = SLOTS[slot];
    return w[0].faces.every(function (f) {
      var a = stickerOf(w[0], f), b = stickerOf(w[1], f);
      return state[a.face][a.i] === state[b.face][b.i];
    });
  }
  // [{slot, paired, wings}] for the 12 slots
  function slots(state) {
    return SLOT_NAMES.map(function (n) { return { slot: n, paired: isPaired(state, n), wings: slotWings(state, n) }; });
  }
  function unpairedSlots(state) { return SLOT_NAMES.filter(function (n) { return !isPaired(state, n); }); }
  // describe the wings of the given slots: [{slot, where, colors, stickers}]
  function describeWings(state, slotNames) {
    var out = [];
    slotNames.forEach(function (n) { slotWings(state, n).forEach(function (w) { out.push(w); }); });
    return out;
  }
  // the color pair of a wing as a sorted string, for "same two colors"
  function colorSet(wing) { return Object.keys(wing.colors).map(function (f) { return wing.colors[f]; }).sort().join(''); }
  // ids ('F4') of the stickers of the wings of the given slots
  function slotStickerIds(slotNames) {
    var out = [];
    slotNames.forEach(function (n) { SLOTS[n].forEach(function (w) { w.stickers.forEach(function (s) { out.push(s.face + s.i); }); }); });
    return out;
  }

  // ---- Algorithms (always Dw, never a lowercase d) ----
  // FLIP: five outer turns. Turns the right edge of the front face over (its two halves swap places) and moves
  //       other pieces without unpairing any other pair.
  // SWAP: swaps the lower half of the left edge with the upper half of the right edge (the two "diagonal" halves).
  var ALGS = {
    FLIP: "R F' U R' F",
    SWAP: "Dw R F' U R' F Dw'",
  };

  // ---- Predicates: all evaluated on the cube as it is held ----
  var FRONT = { UL: 4, LL: 8, UR: 7, LR: 11 }; // front-face stickers of the left (FL) and right (FR) vertical edges
  var PRED = {
    // exactly two edges are not paired and the centers are solved: the situation of this card
    twoLeft: function (st) { return centersSolved(st) && unpairedSlots(st).length === 2; },
    // one of the two unpaired edges is the left vertical edge of the front face (FL)
    oneAtFrontLeft: function (st) { return PRED.twoLeft(st) && !isPaired(st, 'FL'); },
    // the two unpaired edges are the left and the right vertical edges of the front face
    atFrontSides: function (st) {
      if (!PRED.twoLeft(st)) return false;
      var u = unpairedSlots(st);
      return u.indexOf('FL') >= 0 && u.indexOf('FR') >= 0;
    },
    // case 1: on the front face, upper-left = upper-right and lower-left = lower-right (colors)
    sideBySide: function (st) {
      return PRED.atFrontSides(st) && st.F[FRONT.UL] === st.F[FRONT.UR] && st.F[FRONT.LL] === st.F[FRONT.LR];
    },
    // case 2: any other combination of the four front stickers
    crossed: function (st) { return PRED.atFrontSides(st) && !PRED.sideBySide(st); },
    // the centers are solved and all twelve edges are paired
    allPaired: function (st) { return centersSolved(st) && unpairedSlots(st).length === 0; },
    // (for the tests) the halves that share the same two colors are side by side, at the same height
    matchSameHeight: function (st) {
      var l = slotWings(st, 'FL'), r = slotWings(st, 'FR');
      return colorSet(l[1]) === colorSet(r[1]) && colorSet(l[0]) === colorSet(r[0]);
    },
    // (for the tests) the halves that share the same two colors are diagonal
    matchDiagonal: function (st) {
      var l = slotWings(st, 'FL'), r = slotWings(st, 'FR');
      return colorSet(l[1]) === colorSet(r[0]) && colorSet(l[0]) === colorSet(r[1]);
    },
  };
  function PREDICATES(id, state) {
    if (!PRED[id]) throw new Error('Unknown predicate: ' + id);
    return PRED[id](state);
  }
  PREDICATES.IDS = Object.keys(PRED);

  // ---- The recipe ----
  //   hold: the cube must satisfy `when`; `rotations` are the whole-cube rotations (besides doing nothing) that keep the two
  //         edges at the left and right of the front face (upside down).
  //   cases: pick the one whose `when` holds; steps = algorithms, each with the predicate that must hold afterwards.
  var RECIPE = {
    hold: { when: 'atFrontSides', rotations: ['', 'z2'] },
    cases: [
      {
        id: 'side', when: 'sideBySide',
        steps: [{ do: 'alg', alg: ALGS.SWAP, after: 'allPaired' }],
      },
      {
        id: 'cross', when: 'crossed',
        // the FLIP turns the right edge over: the case becomes "side by side"
        steps: [
          { do: 'alg', alg: ALGS.FLIP, after: 'sideBySide' },
          { do: 'alg', alg: ALGS.SWAP, after: 'allPaired' },
        ],
      },
    ],
  };
  function caseById(id) { return RECIPE.cases.filter(function (c) { return c.id === id; })[0] || null; }
  // which case does a held state have? 'side' | 'cross' | null
  function classify(state) {
    for (var i = 0; i < RECIPE.cases.length; i++) if (PRED[RECIPE.cases[i].when](state)) return RECIPE.cases[i].id;
    return null;
  }

  // ---- Setup: bring the two unpaired edges to the left and right of the front face with outer turns only ----
  //   1. rotate the cube (hold) so that one unpaired edge is FL (predicate oneAtFrontLeft);
  //   2. the other one is at slot `at`: do `moves`. They only turn U, D, R and B, which never move FL, and they turn
  //      outer faces only, so every pair and every center stays as it is. (Shortest sequences, found by search.)
  var SETUP = {
    hold: 'oneAtFrontLeft',
    table: [
      { at: 'FR', moves: '' },
      { at: 'UR', moves: "R'" }, { at: 'UF', moves: "U' R'" }, { at: 'UB', moves: "U R'" }, { at: 'UL', moves: "U2 R'" },
      { at: 'DR', moves: 'R' }, { at: 'DF', moves: 'D R' }, { at: 'DB', moves: "D' R" }, { at: 'DL', moves: 'D2 R' },
      { at: 'BR', moves: 'R2' }, { at: 'BL', moves: 'B2 R2' },
    ],
  };

  // ---- Whole-cube rotations (24), as algs of x, y and z ----
  var ROTATIONS = (function () {
    var out = [], seen = {};
    var labels = Cube4.solved('wca');
    function key(alg) {
      var s = Cube4.applyAlg(labels, alg);
      return Cube4.FACES.map(function (f) { return s[f][5] + s[f][6]; }).join('');
    }
    var queue = [''];
    seen[key('')] = true;
    while (queue.length) {
      var a = queue.shift();
      out.push(a);
      ['x', 'y', 'z'].forEach(function (m) {
        var n = (a ? a + ' ' : '') + m, k = key(n);
        if (!seen[k]) { seen[k] = true; queue.push(n); }
      });
    }
    return out;
  })();
  function rotate(state, alg) { return alg ? Cube4.applyAlg(state, alg) : state; }
  // the rotations (of ROTATIONS) after which predicate `when` holds
  function holds(state, whenId) {
    return ROTATIONS.filter(function (r) { return PREDICATES(whenId, rotate(state, r)); });
  }

  // ---- The 16 situations: built from a solved cube, everything else solved ----
  // Clean building blocks (each moves only the wings named and leaves everything else of the cube solved):
  //   PL / PR: flip the left / right vertical edge of the front face (the OLL parity algorithm of js/parity4.js
  //            conjugated by a rotation: its two wings swap places);
  //   T:       the SWAP algorithm (it also moves other edges around; the words below cancel that).
  // A word is a product of these blocks, e.g. "T PL T'" (a prime is the inverse). The 16 words were found by a breadth-first
  // search over the permutations of the 24 wings; the tests rebuild every state and check what it is.
  var BLOCKS = {
    PL: "z " + Parity4.ALGS.OLL_PARITY + " z'",
    PR: "z' " + Parity4.ALGS.OLL_PARITY + ' z',
    T: ALGS.SWAP,
  };
  function expandWord(word) {
    return String(word).trim().split(/\s+/).map(function (t) {
      var inv = /'$/.test(t), b = inv ? t.slice(0, -1) : t;
      if (!BLOCKS[b]) throw new Error('Unknown block ' + t);
      return inv ? Cube4.invertAlg(BLOCKS[b]) : BLOCKS[b];
    }).join(' ');
  }
  var SITUATIONS = [
    { id: 'e2-00', word: "T PL T'" }, { id: 'e2-01', word: "T PR T'" },
    { id: 'e2-02', word: "PL T PL T'" }, { id: 'e2-03', word: "PL T PR T'" },
    { id: 'e2-04', word: "PR T PL T'" }, { id: 'e2-05', word: "PR T PR T'" },
    { id: 'e2-06', word: "T PL T' PL" }, { id: 'e2-07', word: "T PL T' PR" },
    { id: 'e2-08', word: "T PR T' PL" }, { id: 'e2-09', word: "T PR T' PR" },
    { id: 'e2-10', word: "PL PR T PL T'" }, { id: 'e2-11', word: "PL PR T PR T'" },
    { id: 'e2-12', word: "PL T PL T' PL" }, { id: 'e2-13', word: "PL T PL T' PR" },
    { id: 'e2-14', word: "PL T PR T' PL" }, { id: 'e2-15', word: "PL T PR T' PR" },
  ];
  // the examples of the diagrams: one situation of each case
  var EXAMPLES = { side: 'e2-06', cross: 'e2-00' };
  var memo = {};
  function situationState(id) {
    if (memo[id]) return memo[id];
    var s = SITUATIONS.filter(function (x) { return x.id === id; })[0];
    if (!s) throw new Error('Unknown situation ' + id);
    memo[id] = Cube4.applyAlg(Cube4.solved('yellowTop'), expandWord(s.word));
    return memo[id];
  }
  function exampleState(caseId) { return situationState(EXAMPLES[caseId]); }

  // ---- Running the recipe ----
  // Follow a set of sticker ids ('F4') through an algorithm: where do they end up?
  function labelState() {
    var s = {};
    Cube4.FACES.forEach(function (f) { s[f] = []; for (var i = 0; i < Cube4.N * Cube4.N; i++) s[f].push(f + i); });
    return s;
  }
  function track(ids, alg) {
    var after = Cube4.applyAlg(labelState(), alg), out = [];
    Cube4.FACES.forEach(function (f) { after[f].forEach(function (lab, i) { if (ids.indexOf(lab) >= 0) out.push(f + i); }); });
    return out;
  }
  // Apply the recipe of the case of `state` (already held). -> {case, steps: [{alg, state, tracked}], tracked, state}
  // `tracked` = ids of the stickers of the four halves of the two edges (before the first step and after every step).
  function run(state) {
    var id = classify(state);
    if (!id) throw new Error('Not a last-two-edges situation held with the edges at the front sides');
    var tracked = slotStickerIds(['FL', 'FR']), start = { state: state, tracked: tracked }, steps = [];
    caseById(id).steps.forEach(function (s) {
      state = Cube4.applyAlg(state, s.alg);
      tracked = track(tracked, s.alg);
      steps.push({ alg: s.alg, after: s.after, state: state, tracked: tracked });
    });
    return { case: id, start: start, steps: steps, state: state };
  }

  // The front of the cube seen straight on, as the data of Cube3D.topSvg: the 4x4 front face with the neighboring stickers
  // around it (the front row of U on top, of D below, the front column of L on the left and of R on the right).
  // `keep`: ids ('F4') that are drawn in color together with the centers; everything else is gray ('x').
  function frontView(state, keep) {
    var shown = function (face, i) {
      var id = face + i;
      return CENTER_IDX.indexOf(i) >= 0 && face === 'F' ? true : (keep ? keep.indexOf(id) >= 0 : true);
    };
    var col = function (face, i) { return shown(face, i) ? state[face][i] : 'x'; };
    var u = [], k;
    for (k = 0; k < 16; k++) u.push(col('F', k));
    return {
      u: u,
      b: [12, 13, 14, 15].map(function (i) { return col('U', i); }),
      f: [0, 1, 2, 3].map(function (i) { return col('D', i); }),
      l: [3, 7, 11, 15].map(function (i) { return col('L', i); }),
      r: [0, 4, 8, 12].map(function (i) { return col('R', i); }),
    };
  }

  var Edges4 = {
    ALGS: ALGS,
    RECIPE: RECIPE,
    SETUP: SETUP,
    SITUATIONS: SITUATIONS,
    EXAMPLES: EXAMPLES,
    BLOCKS: BLOCKS,
    SLOT_NAMES: SLOT_NAMES,
    ROTATIONS: ROTATIONS,
    WINGS: WINGS,
    SLOTS: SLOTS,
    PREDICATES: PREDICATES,
    centersSolved: centersSolved,
    slots: slots,
    isPaired: isPaired,
    unpairedSlots: unpairedSlots,
    slotWings: slotWings,
    describeWings: describeWings,
    colorSet: colorSet,
    slotStickerIds: slotStickerIds,
    caseById: caseById,
    classify: classify,
    rotate: rotate,
    holds: holds,
    expandWord: expandWord,
    situationState: situationState,
    exampleState: exampleState,
    track: track,
    run: run,
    frontView: frontView,
  };

  if (isNode) module.exports = Edges4;
  else root.Edges4 = Edges4;
})(typeof window !== 'undefined' ? window : globalThis);
