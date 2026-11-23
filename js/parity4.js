(function (root) {
  'use strict';

  // 4x4 parity data: notation entries, the two parity algorithms, the four cases with machine-checkable
  // recipes, and the predicates ("hold the cube so that ...") shared by the view and the tests.
  // Everything here is verified in tests/parity.test.js against js/cube4.js and an independent simulator.
  var isNode = typeof module !== 'undefined' && module.exports;
  var Cube4 = isNode ? require('./cube4.js') : root.Cube4;
  var ALGS3 = isNode ? require('./algs.js') : root.ALGS;

  // ---- The two parity algorithms. ALWAYS written with inner slices (2R, 2L) and two-layer wide moves
  //      (Uw); never with lowercase r/l, because many tutorials use "r2" for the inner slice only while
  //      this app (and WCA notation) reads r = Rw = two layers. ----
  var ALGS = {
    // Flips ONE dedge (the front-top one, UF) and changes nothing else. 15 moves, no rotations.
    // Same sequence as the common "r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2", with inner slices instead of wide moves
    // (the wide-move version also flips/swaps neighbouring corners; this one is clean).
    OLL_PARITY: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
    // Swaps the top-front and top-back dedges AND turns the top layer by 180 degrees: follow it with U2
    // and the net effect is a clean swap of those two dedges (corners and every other piece untouched).
    PLL_PARITY: '2R2 U2 2R2 Uw2 2R2 Uw2',
    // The T-perm of the app (js/algs.js 'cp-adj'), used by the corner cases.
    TPERM: "R U R' U' R' F R2 U' R' U' R U R' F'",
  };

  // ---- Notation entries: one structured check each, {move, face, expect}, where expect is the on-screen
  //      direction the stickers of `face` travel in the app's default view (see Cube4.flow). ----
  //      kind: outer | wide | inner | rotation.  equiv: how the move decomposes into outer + inner moves.
  var UA = "R U' R U R U R U' R' U' R2"; // js/algs.js 'ep-ua'

  var NOTATION = [
    // outer faces, same order as the 3x3 Notation tab. D, L and B are the ones that look reversed (callout: true in the view)
    { move: 'U', kind: 'outer', equiv: null, check: { move: 'U', face: 'F', expect: 'left' } },
    { move: 'D', kind: 'outer', equiv: null, check: { move: 'D', face: 'F', expect: 'right' } },
    { move: 'R', kind: 'outer', equiv: null, check: { move: 'R', face: 'F', expect: 'up' } },
    { move: 'L', kind: 'outer', equiv: null, check: { move: 'L', face: 'F', expect: 'down' } },
    { move: 'F', kind: 'outer', equiv: null, check: { move: 'F', face: 'F', expect: 'cw' } },
    { move: 'B', kind: 'outer', equiv: null, check: { move: 'B', face: 'U', expect: 'left' } },
    { move: '2R', kind: 'inner', equiv: null, check: { move: '2R', face: 'F', expect: 'up' } },
    { move: '2L', kind: 'inner', equiv: null, check: { move: '2L', face: 'F', expect: 'down' } },
    { move: 'Rw', kind: 'wide', equiv: 'R 2R', check: { move: 'Rw', face: 'F', expect: 'up' } },
    { move: 'Lw', kind: 'wide', equiv: 'L 2L', check: { move: 'Lw', face: 'F', expect: 'down' } },
    { move: 'Uw', kind: 'wide', equiv: 'U 2U', check: { move: 'Uw', face: 'F', expect: 'left' } },
    // the 4x4 scrambles of the app use Uw, Rw and Fw
    { move: 'Fw', kind: 'wide', equiv: 'F 2F', check: { move: 'Fw', face: 'F', expect: 'cw' } },
    // three layers: what the 3x3 r and f of the Trainer become on a 4x4 (see to4x4)
    { move: '3Rw', kind: 'wide3', equiv: "R 2R 2L'", check: { move: '3Rw', face: 'F', expect: 'up' } },
    { move: '3Fw', kind: 'wide3', equiv: "F 2F 2B'", check: { move: '3Fw', face: 'F', expect: 'cw' } },
    { move: 'x', kind: 'rotation', equiv: "R 2R 2L' L'", check: { move: 'x', face: 'F', expect: 'up' } },
    { move: 'y', kind: 'rotation', equiv: "U 2U 2D' D'", check: { move: 'y', face: 'F', expect: 'left' } },
  ];

  // ---- The 16 algorithms of the Trainer (js/algs.js) written for a 4x4 ----
  // They are written for a 3x3: a lowercase r/f turns the outer face AND the middle layer, and M is the middle slice.
  // On a 4x4 the middle is two inner slices, so: r -> 3Rw (R + 2R + 2L', three layers), f -> 3Fw, M -> 2L 2R'
  // (both inner slices turning like L). Face turns (R U F D ...) are the same. Verified in tests/parity.test.js: the
  // result on a 4x4 whose dedges are paired and centers solved is exactly the 3x3 result.
  function to4x4(alg) {
    return String(alg).trim().split(/\s+/).map(function (tok) {
      var m = /^([A-Za-z])(2|')?$/.exec(tok);
      if (!m) throw new Error('Invalid 3x3 move: "' + tok + '"');
      var base = m[1], suf = m[2] || '';
      if (base === 'M') {
        // M = 2L 2R'. M' flips both halves, M2 is a half turn of both.
        if (suf === '2') return '2L2 2R2';
        return suf === "'" ? "2L' 2R" : "2L 2R'";
      }
      if (/[rludfb]/.test(base)) return '3' + base.toUpperCase() + 'w' + suf;
      if (/[RLUDFB]/.test(base)) return tok;
      throw new Error('No 4x4 version of the move "' + tok + '"');
    }).join(' ');
  }
  // [{id, alg3, alg4, changed}] for all the Trainer algorithms; `changed` = it uses r, f or M, so the 4x4 version differs
  var TRAINER = ALGS3.map(function (a) {
    var a4 = to4x4(a.alg);
    return { id: a.id, set: a.set, alg3: a.alg, alg4: a4, changed: a4 !== a.alg };
  });
  function trainerAlg(id) {
    for (var i = 0; i < TRAINER.length; i++) if (TRAINER[i].id === id) return TRAINER[i];
    throw new Error('Unknown Trainer algorithm: ' + id);
  }

  // ---- Piece analysis of the last layer, relative to the centers. Slot order is clockwise seen from above. ----
  var EDGES = [
    { name: 'UF', wings: [[13, 'F', 1], [14, 'F', 2]] },
    { name: 'UR', wings: [[11, 'R', 1], [7, 'R', 2]] },
    { name: 'UB', wings: [[2, 'B', 1], [1, 'B', 2]] },
    { name: 'UL', wings: [[4, 'L', 1], [8, 'L', 2]] },
  ];
  var CORNERS = [
    { name: 'UFR', u: 15, s: [['F', 3], ['R', 0]] },
    { name: 'UBR', u: 3, s: [['R', 3], ['B', 0]] },
    { name: 'UBL', u: 0, s: [['B', 3], ['L', 0]] },
    { name: 'UFL', u: 12, s: [['L', 3], ['F', 0]] },
  ];
  var SIDE_OF_SLOT = ['F', 'R', 'B', 'L']; // the side face of each edge slot; corner k sits between side k and side k+1

  function centers(st) {
    return { U: st.U[5], F: st.F[5], R: st.R[5], B: st.B[5], L: st.L[5], D: st.D[5] };
  }

  // -> {top, edges: [{slot, home, oriented, paired}], corners: [{slot, home, oriented}]}; home = -1 when the piece
  //    is not a last-layer piece (or its wings disagree).
  function analyze(st) {
    var c = centers(st), top = c.U;
    var sideC = SIDE_OF_SLOT.map(function (f) { return c[f]; });
    var edges = EDGES.map(function (e, k) {
      var w = e.wings.map(function (x) { return [st.U[x[0]], st[x[1]][x[2]]]; });
      var one = function (p) {
        var side = p[0] === top ? p[1] : (p[1] === top ? p[0] : null);
        return { home: side == null ? -1 : sideC.indexOf(side), oriented: p[0] === top };
      };
      var a = one(w[0]), b = one(w[1]);
      var paired = a.home === b.home && a.oriented === b.oriented && a.home >= 0;
      return { slot: k, home: paired ? a.home : -1, oriented: paired ? a.oriented : false, paired: paired };
    });
    var corners = CORNERS.map(function (cn, k) {
      var cols = [st.U[cn.u]].concat(cn.s.map(function (x) { return st[x[0]][x[1]]; }));
      var side = cols.filter(function (x) { return x !== top; });
      var home = -1;
      if (cols.indexOf(top) >= 0 && side.length === 2) {
        for (var h = 0; h < 4; h++) {
          var want = [sideC[h], sideC[(h + 1) % 4]];
          if (side.indexOf(want[0]) >= 0 && side.indexOf(want[1]) >= 0) home = h;
        }
      }
      return { slot: k, home: home, oriented: cols[0] === top };
    });
    return { top: top, edges: edges, corners: corners };
  }

  // cycles of a slot->home permutation as a list of arrays (fixed points omitted); null if invalid
  function cycles(list) {
    var homes = list.map(function (p) { return p.home; });
    if (homes.some(function (h) { return h < 0; })) return null;
    if (homes.slice().sort().join() !== '0,1,2,3') return null;
    var seen = {}, out = [];
    for (var i = 0; i < 4; i++) {
      if (seen[i]) continue;
      var cyc = [], j = i;
      while (!seen[j]) { seen[j] = true; cyc.push(j); j = homes[j]; }
      if (cyc.length > 1) out.push(cyc);
    }
    return out;
  }
  var allOriented = function (list) { return list.every(function (p) { return p.oriented; }); };

  // Is the last layer exactly "one pair of slots swapped, everything else solved and oriented"?
  // returns {a, b} slot indices, or null
  function onlySwap(list) {
    var cy = cycles(list);
    if (!cy || cy.length !== 1 || cy[0].length !== 2 || !allOriented(list)) return null;
    return { a: cy[0][0], b: cy[0][1] };
  }
  var isSolvedLayer = function (list) { var cy = cycles(list); return !!cy && cy.length === 0 && allOriented(list); };

  function hasHeadlights(st, face) { return st[face][0] === st[face][3]; }

  // ---- Predicates: "when" ids used by the recipes. All are evaluated on the cube as it is held. ----
  var PRED = {
    // exactly the front-top dedge is flipped (yellow on the side), the other three oriented
    flippedEdgeFront: function (st) {
      var a = analyze(st).edges;
      return a[0].paired && !a[0].oriented && a[1].oriented && a[2].oriented && a[3].oriented;
    },
    // the front-top dedge is flipped (yellow on the side); the others may be anything. With 1 or 3 flipped
    // edges (odd) this is the hold of the OLL parity: the algorithm flips the front one.
    frontEdgeFlipped: function (st) {
      var a = analyze(st).edges[0];
      return a.paired && !a.oriented;
    },
    // preconditions of the PLL cases: corners (resp. edges) all solved against the centers
    cornersSolved: function (st) { return isSolvedLayer(analyze(st).corners); },
    edgesSolved: function (st) { return isSolvedLayer(analyze(st).edges); },
    // every top dedge shows the top color on top (the yellow cross is complete)
    crossDone: function (st) { return allOriented(analyze(st).edges); },
    // top edges solved except the front and back dedges, which are exchanged
    swappedEdgesFrontBack: function (st) {
      var s = onlySwap(analyze(st).edges);
      return !!s && s.a === 0 && s.b === 2;
    },
    // top edges solved except the front and right dedges, which are exchanged
    swappedEdgesFrontRight: function (st) {
      var s = onlySwap(analyze(st).edges);
      return !!s && s.a === 0 && s.b === 1;
    },
    // two corners of the same color on the back or the front face only (not on the sides)
    headlightsFrontOrBack: function (st) {
      return (hasHeadlights(st, 'F') !== hasHeadlights(st, 'B')) && !hasHeadlights(st, 'L') && !hasHeadlights(st, 'R');
    },
    // headlights on the left face and on no other face (the position the app's T-perm expects)
    headlightsLeft: function (st) {
      return hasHeadlights(st, 'L') && !hasHeadlights(st, 'R') && !hasHeadlights(st, 'F') && !hasHeadlights(st, 'B');
    },
    // any way of holding the cube works (the algorithm does not care)
    anyHold: function () { return true; },
    // the top layer is completely solved
    layerSolved: function (st) {
      var a = analyze(st);
      return isSolvedLayer(a.edges) && isSolvedLayer(a.corners);
    },
  };
  function PREDICATES(id, state) {
    if (!PRED[id]) throw new Error('Unknown predicate: ' + id);
    return PRED[id](state);
  }
  PREDICATES.IDS = Object.keys(PRED);

  // ---- Cases. step: where it shows up in the 4LLL flow (the app's steps: EO cross, OCLL, CP, EP).
  //      setup builds the case from Cube4.solved('yellowTop'). steps is the machine-checkable recipe:
  //        {do:'hold', when}              hold the cube (a y rotation only) so that predicate `when` is true
  //        {do:'alg', alg, after?}        apply the algorithm (optional predicate that must hold afterwards)
  //        {do:'auf'}                     turn U until the cube is solved
  //        {do:'then', case}              continue with that case's recipe
  //        {do:'then3x3', set, algs}      continue with the normal 3x3 step `set` using js/algs.js ids `algs`
  //                                       (set 'EPany': any one of the listed algs, from the right hold, then AUF).
  //                                       Always run the 4x4 form: Parity4.to4x4(alg).
  var CASES = [
    {
      id: 'oll-parity', step: 'oll', mask: 'oll',
      // one flipped dedge: the yellow cross has 3 yellow edges (or 1) instead of 2 or 4
      setup: ALGS.OLL_PARITY,
      pre: [],
      // hold a flipped edge in front (works for 1 flipped edge, and for 3: then 2 stay flipped = a normal line/L/dot)
      steps: [
        { do: 'hold', when: 'frontEdgeFlipped' },
        { do: 'alg', alg: ALGS.OLL_PARITY, after: 'crossDone' },
        { do: 'then3x3', set: 'OCLL', algs: ['ocll-sune', 'ocll-antisune', 'ocll-h', 'ocll-pi', 'ocll-u', 'ocll-t', 'ocll-l'] },
      ],
    },
    {
      id: 'pll-opposite', step: 'pll', mask: 'pll',
      // corners solved, two OPPOSITE dedges exchanged (front/back here)
      setup: ALGS.PLL_PARITY + ' U2',
      pre: ['cornersSolved'],
      steps: [
        { do: 'hold', when: 'swappedEdgesFrontBack' },
        { do: 'alg', alg: ALGS.PLL_PARITY },
        { do: 'auf' },
      ],
    },
    {
      id: 'pll-adjacent', step: 'pll', mask: 'pll',
      // corners solved, two ADJACENT dedges exchanged (front/right here)
      // = inverse of the 3x3 Ua (a 3-cycle of edges) followed by the clean dedge swap seen from the right
      pre: ['cornersSolved'],
      setup: Cube4.invertAlg(UA) + ' y ' + ALGS.PLL_PARITY + " U2 y'",
      steps: [
        { do: 'hold', when: 'swappedEdgesFrontRight' },
        { do: 'alg', alg: ALGS.PLL_PARITY },
        { do: 'alg', alg: 'U2' },
        // what is left is a clean 3-cycle of edges with the left edge solved: hold it at the back and do the Ub (verified: Ua never solves it)
        { do: 'then3x3', set: 'EP', algs: ['ep-ub'] },
      ],
    },
    {
      id: 'pll-corners', step: 'pll', mask: 'pll',
      // edges solved, two ADJACENT corners exchanged (here the front ones: headlights at the back).
      // = a 3x3 T-perm (swaps two corners AND two edges) seen from the left, then the clean dedge swap that puts the edges back
      pre: ['edgesSolved'],
      setup: "y' " + ALGS.TPERM + ' y ' + ALGS.PLL_PARITY + ' U2',
      steps: [
        // 4LLL-consistent flow: the normal corner step first (T-perm, headlights on the left)...
        { do: 'then3x3', set: 'CP', algs: ['cp-adj'], hold: 'headlightsLeft' },
        // ...which leaves two opposite dedges swapped: that is pll-opposite.
        { do: 'then', case: 'pll-opposite' },
      ],
      // Shortcut (same result, no separate corner step): hold the headlights in front or at the back,
      // do the parity algorithm, then the T-perm with the headlights on the left, then AUF.
      shortcut: [
        { do: 'hold', when: 'headlightsFrontOrBack' },
        { do: 'alg', alg: ALGS.PLL_PARITY },
        { do: 'then3x3', set: 'CP', algs: ['cp-adj'], hold: 'headlightsLeft' },
      ],
    },
    {
      id: 'pll-cycle', step: 'pll', mask: 'pll',
      // corners solved, an odd arrangement of the dedges that is not a single swap: all four dedges in a cycle.
      // = a 3x3 Ua-like 3-cycle of edges followed by the clean dedge swap, which links the fourth edge in.
      pre: ['cornersSolved'],
      setup: Cube4.invertAlg(UA) + ' ' + ALGS.PLL_PARITY + ' U2',
      steps: [
        // general rule (verified from every hold, for all six 4-cycles): parity algorithm once, U2, then the normal
        // step 4 (Ua, Ub, H or Z; the Ua and Ub need the solved edge at the back), then AUF
        { do: 'hold', when: 'anyHold' },
        { do: 'alg', alg: ALGS.PLL_PARITY },
        { do: 'alg', alg: 'U2' },
        { do: 'then3x3', set: 'EPany', algs: ['ep-ua', 'ep-ub', 'ep-h', 'ep-z'] },
      ],
    },
  ];

  // ---- Small helpers shared by view and tests ----
  var Y_ROT = ['', 'y', 'y2', "y'"];
  function rotateY(state, k) { return k ? Cube4.applyAlg(state, Y_ROT[((k % 4) + 4) % 4]) : state; }
  function holds(state, whenId) {
    var out = [];
    for (var k = 0; k < 4; k++) if (PREDICATES(whenId, rotateY(state, k))) out.push(k);
    return out;
  }
  var AUFS = ['', 'U', "U'", 'U2'];
  // turn U until solved; -> the AUF alg ('' / "U" / "U'" / "U2") or null
  function aufSolve(state) {
    for (var i = 0; i < 4; i++) if (Cube4.isSolved(Cube4.applyAlg(state, AUFS[i]))) return AUFS[i];
    return null;
  }
  function caseById(id) { return CASES.filter(function (c) { return c.id === id; })[0] || null; }
  function caseState(id) { return Cube4.applyAlg(Cube4.solved('yellowTop'), caseById(id).setup); }

  // Name the parity case of a yellow-top state (any y orientation), or null.
  function classify(state) {
    var a = analyze(state);
    var eCy = cycles(a.edges), cCy = cycles(a.corners);
    if (a.edges.every(function (e) { return e.paired && e.home >= 0; })) {
      var flipped = a.edges.filter(function (e) { return !e.oriented; }).length;
      if (flipped % 2 === 1) return 'oll-parity';
    }
    if (!eCy || !cCy || !allOriented(a.edges) || !allOriented(a.corners)) return null;
    var es = onlySwap(a.edges), cs = onlySwap(a.corners);
    if (cs && !eCy.length) return (cs.b - cs.a) === 2 ? null : 'pll-corners'; // a diagonal corner swap is not one of our cases
    if (es && !cCy.length) return (es.b - es.a) === 2 ? 'pll-opposite' : 'pll-adjacent';
    // corners solved and the four dedges in one 4-cycle (an odd permutation that is not a single swap)
    if (!cCy.length && eCy.length === 1 && eCy[0].length === 4) return 'pll-cycle';
    return null;
  }

  var Parity4 = {
    ALGS: ALGS,
    to4x4: to4x4,
    TRAINER: TRAINER,
    trainerAlg: trainerAlg,
    NOTATION: NOTATION,
    CASES: CASES,
    PREDICATES: PREDICATES,
    analyze: analyze,
    classify: classify,
    holds: holds,
    rotateY: rotateY,
    aufSolve: aufSolve,
    caseById: caseById,
    caseState: caseState,
    // diagram data of a case with its mask, as the view shows it
    caseView: function (id) {
      var c = caseById(id);
      return Cube4.lastLayerView(caseState(id), c.mask);
    },
  };

  if (isNode) module.exports = Parity4;
  else root.Parity4 = Parity4;
})(typeof window !== 'undefined' ? window : globalThis);
