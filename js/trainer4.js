(function (root) {
  'use strict';

  // Trainer in 4x4 mode: the case list. It is the 16 algorithms of the 3x3 Trainer written for a 4x4
  // (r -> 3Rw, f -> 3Fw, M -> 2L 2R', see Parity4.to4x4) plus the parity cases of the last layer.
  //   - Practice cases (one algorithm each): the 16 + q4-oll-parity (3 yellow dedges on top) + q4-oll-parity-1
  //     (1 yellow dedge on top: OLL parity, a quarter turn, the line algorithm) + q4-pll-opposite.
  //   - Learn-only cards (a recipe with several steps, no single algorithm): q4-eo-odd (in the yellow cross set:
  //     "1 or 3 yellow dedges on top?"), q4-pll-adjacent, q4-pll-corners, q4-pll-cycle. They show a summary and
  //     point to the Notation tab (4x4 section) for the full steps.
  // Every case has a Practice setup (inverse of the algorithm + a random AUF) and a top-view diagram
  // (Cube3D.topSvg of Cube4.lastLayerView). Ids are 'q4-' + the 3x3 id (or the parity id), so the 3x3 progress
  // stored under the plain ids is never touched. Verified in tests/trainer4.test.js.
  var isNode = typeof module !== 'undefined' && module.exports;
  var I18N = isNode ? require('./i18n.js') : root.I18N;
  var Cube4 = isNode ? require('./cube4.js') : root.Cube4;
  var Cube3D = isNode ? require('./cube3d.js') : root.Cube3D;
  var P = isNode ? require('./parity4.js') : root.Parity4;
  var ALGS3 = isNode ? require('./algs.js') : root.ALGS;

  // ---- Strings (prefix 't4.', both languages) ----
  var STRINGS = {
    en: {
      't4.set.OLLP': 'OLL parity (4x4)',
      't4.set.PLLP': 'PLL parity (4x4)',
      't4.learnOnly': 'Learn only',
      't4.learnOnly.note': 'This card has no single algorithm to practice here. Use the full steps in the Notation tab.',
      't4.openNotation': 'See the full steps',
      't4.changed': 'This is the 4x4 version: it differs from the 3x3 one because the moves that turn the middle layer are written for a 4x4 (three layers, or both inner slices). Do not use the 3x3 version on a 4x4.',
      't4.hold.label': 'How to hold the cube:',
      't4.lbl.parity': 'PLL parity algorithm',
      't4.lbl.ub': 'Ub, step 4 (4x4)',
      't4.lbl.tperm': 'T-perm, step 3',
      't4.lbl.steps': 'Summary of the steps:',
      't4.switch.title': 'Solving a 4x4?',
      't4.switch.text': 'The whole app can work for a 4x4: timer, trainer, stats, plan and notation. Switching changes the Trainer to the 4x4 version of its algorithms, with the parity cases, and the Timer to 4x4 scrambles and solves. Your 3x3 solves and progress are kept apart and come back when you switch back.',
      't4.switch.btn': 'Switch to 4x4',

      't4.c.q4-eo-odd.name': '1 or 3 yellow dedges on top? (OLL parity)',
      't4.c.q4-eo-odd.tip': 'Before you use the yellow cross algorithms, count the dedges that show yellow on top. A 3x3 only has 0, 2 or 4. If you see 1 (like in the diagram: the other three show yellow on their sides) or 3, it is OLL parity, and none of the cases above (line, L shape, dot) solves it. The two variants are in the OLL parity set below, and with diagrams in the Notation tab, under "OLL parity in the yellow cross step".',
      't4.c.q4-eo-odd.sum': 'With 3 yellow dedges: hold the flipped one at the front and do the OLL parity algorithm. With only 1: hold it at the back, do the OLL parity algorithm, turn the top layer a quarter turn and do the line algorithm. Either way the yellow cross ends up complete.',
      't4.c.q4-oll-parity.name': 'OLL parity: 3 yellow dedges on top',
      't4.c.q4-oll-parity.tip': 'In step 1 (yellow cross), with the edges already paired, you see 3 yellow dedges on top: the fourth one shows yellow on its side. That never happens on a 3x3. The algorithm flips only the dedge at the front, and that completes the cross. With only 1 yellow dedge, use the next case.',
      't4.c.q4-oll-parity.hold': 'Hold the cube with the dedge that shows yellow on its side at the front (turn the whole cube sideways if needed). Then continue with step 2 as usual.',
      't4.c.q4-oll-parity-1.name': 'OLL parity: only 1 yellow dedge on top',
      't4.c.q4-oll-parity-1.tip': 'In step 1 (yellow cross), with the edges already paired, you see only 1 yellow dedge on top: the other three show yellow on their sides. It looks like a different case, but it is OLL parity too. The sequence is the OLL parity algorithm, a quarter turn of the top layer and the line algorithm of step 1. The corners can be in any state.',
      't4.c.q4-oll-parity-1.hold': 'Turn the whole cube sideways until the only yellow dedge is at the back, the farthest from you. The U in the middle can also be U\': either turn makes the line horizontal. Then continue with step 2.',
      't4.c.q4-pll-opposite.name': 'PLL parity: opposite dedges swapped',
      't4.c.q4-pll-opposite.tip': 'In step 4 (permute edges), with the corners already placed, two opposite dedges (front and back, or left and right) are in each other\'s place and the other two are correct. No 3x3 case looks like this. The last U2 of the sequence is the turn that lines up the top layer.',
      't4.c.q4-pll-opposite.hold': 'Turn the top layer until the corners match their centers, then turn the whole cube sideways until the two swapped dedges are at the front and at the back.',
      't4.c.q4-pll-adjacent.name': 'PLL parity: neighboring dedges swapped',
      't4.c.q4-pll-adjacent.tip': 'In step 4 (permute edges), with the corners already placed, two dedges that are next to each other (for example front and right) are in each other\'s place and the other two are correct. A 3x3 never has just two edges swapped.',
      't4.c.q4-pll-adjacent.sum': 'Turn the whole cube sideways until the swapped dedges are at the front and on the right. Do the PLL parity algorithm and then U2. Three dedges are left out of place: finish with the Ub of step 4 (4x4 version below), holding the solved dedge at the back.',
      't4.c.q4-pll-corners.name': 'PLL parity: two corners swapped',
      't4.c.q4-pll-corners.tip': 'In step 3 (permute corners) two corners that are next to each other are swapped while all the edges are already correct. The two corners that are not swapped form the usual headlights. On a 3x3 a corner swap always comes with an edge swap, so this one is parity.',
      't4.c.q4-pll-corners.sum': 'Do the normal corner step first (T-perm, with the headlights on the left). That leaves two opposite dedges swapped, which is the case "PLL parity: opposite dedges swapped": finish with it. Shortcut: with the headlights at the front or at the back, do the PLL parity algorithm first and then the T-perm with the headlights on the left.',
      't4.c.q4-pll-cycle.name': 'PLL parity: dedges in a cycle',
      't4.c.q4-pll-cycle.tip': 'In step 4 (permute edges), with the corners already placed, the dedges are out of place in a way that is not a Ua, Ub, H or Z and not a single swap (for example all four dedges in a cycle). If no Ua, Ub, H or Z solves your edges, you have parity.',
      't4.c.q4-pll-cycle.sum': 'Hold the cube any way you like. Do the PLL parity algorithm once and then U2. Now it is a normal step 4: solve it with the Ua, Ub, H or Z (H and Z in their 4x4 version; the Ua and Ub with the solved dedge at the back), then line up the top layer.'
    },
    es: {
      't4.set.OLLP': 'Paridad de OLL (4x4)',
      't4.set.PLLP': 'Paridad de PLL (4x4)',
      't4.learnOnly': 'Solo aprender',
      't4.learnOnly.note': 'Esta tarjeta no tiene un único algoritmo para practicar aquí. Mira los pasos completos en la pestaña Notación.',
      't4.openNotation': 'Ver los pasos completos',
      't4.changed': 'Esta es la versión de 4x4: se diferencia de la de 3x3 porque los movimientos que giran la capa del medio están escritos para un 4x4 (tres capas, o las dos capas interiores). No uses la versión de 3x3 en un 4x4.',
      't4.hold.label': 'Cómo sostener el cubo:',
      't4.lbl.parity': 'Algoritmo de paridad de PLL',
      't4.lbl.ub': 'Ub, paso 4 (4x4)',
      't4.lbl.tperm': 'T-perm, paso 3',
      't4.lbl.steps': 'Resumen de los pasos:',
      't4.switch.title': '¿Resuelves un 4x4?',
      't4.switch.text': 'Toda la app puede funcionar para un 4x4: cronómetro, entrenador, estadísticas, plan y notación. Al cambiar, el Entrenador pasa a la versión 4x4 de sus algoritmos, con los casos de paridad, y el Cronómetro a mezclas y resoluciones de 4x4. Tus resoluciones y tu progreso de 3x3 se guardan aparte y vuelven al cambiar de nuevo.',
      't4.switch.btn': 'Cambiar a 4x4',

      't4.c.q4-eo-odd.name': '¿1 o 3 aristas dobles amarillas arriba? (paridad de OLL)',
      't4.c.q4-eo-odd.tip': 'Antes de usar los algoritmos de la cruz amarilla, cuenta las aristas dobles que muestran amarillo arriba. Un 3x3 solo tiene 0, 2 o 4. Si ves 1 (como en el diagrama: las otras tres muestran amarillo de lado) o 3, es paridad de OLL, y ninguno de los casos de arriba (línea, forma de L, punto) la resuelve. Las dos variantes están en el conjunto de paridad de OLL de abajo, y con diagramas en la pestaña Notación, bajo «Paridad de OLL en el paso de la cruz amarilla».',
      't4.c.q4-eo-odd.sum': 'Con 3 aristas dobles amarillas: pon delante la volteada y haz el algoritmo de paridad de OLL. Con solo 1: ponla atrás, haz el algoritmo de paridad de OLL, gira la capa de arriba un cuarto de vuelta y haz el algoritmo de la línea. En los dos casos la cruz amarilla queda completa.',
      't4.c.q4-oll-parity.name': 'Paridad de OLL: 3 aristas dobles amarillas arriba',
      't4.c.q4-oll-parity.tip': 'En el paso 1 (cruz amarilla), con las aristas ya emparejadas, ves 3 aristas dobles amarillas arriba: la cuarta muestra amarillo de lado. Eso nunca pasa en un 3x3. El algoritmo voltea solo la arista doble de delante, y eso completa la cruz. Con solo 1 arista doble amarilla, usa el caso siguiente.',
      't4.c.q4-oll-parity.hold': 'Sostén el cubo con la arista doble que muestra amarillo de lado delante (gira el cubo entero hacia un lado si hace falta). Luego sigue con el paso 2 como siempre.',
      't4.c.q4-oll-parity-1.name': 'Paridad de OLL: solo 1 arista doble amarilla arriba',
      't4.c.q4-oll-parity-1.tip': 'En el paso 1 (cruz amarilla), con las aristas ya emparejadas, ves solo 1 arista doble amarilla arriba: las otras tres muestran amarillo de lado. Parece otro caso, pero también es paridad de OLL. La secuencia es el algoritmo de paridad de OLL, un cuarto de vuelta de la capa de arriba y el algoritmo de la línea del paso 1. Las esquinas pueden estar de cualquier manera.',
      't4.c.q4-oll-parity-1.hold': 'Gira el cubo entero hacia un lado hasta que la única arista doble amarilla quede atrás, la más lejana a ti. La U del medio también puede ser U\': cualquiera de los dos giros deja la línea horizontal. Luego sigue con el paso 2.',
      't4.c.q4-pll-opposite.name': 'Paridad de PLL: aristas dobles opuestas intercambiadas',
      't4.c.q4-pll-opposite.tip': 'En el paso 4 (permutar aristas), con las esquinas ya colocadas, dos aristas dobles opuestas (delante y atrás, o izquierda y derecha) están en el sitio de la otra y las otras dos están bien. Ningún caso de 3x3 se ve así. La última U2 de la secuencia es el giro que alinea la capa de arriba.',
      't4.c.q4-pll-opposite.hold': 'Gira la capa de arriba hasta que las esquinas coincidan con sus centros y luego gira el cubo entero hacia un lado hasta que las dos aristas dobles intercambiadas queden delante y atrás.',
      't4.c.q4-pll-adjacent.name': 'Paridad de PLL: aristas dobles vecinas intercambiadas',
      't4.c.q4-pll-adjacent.tip': 'En el paso 4 (permutar aristas), con las esquinas ya colocadas, dos aristas dobles que están una junto a la otra (por ejemplo delante y a la derecha) están en el sitio de la otra y las otras dos están bien. Un 3x3 nunca tiene solo dos aristas intercambiadas.',
      't4.c.q4-pll-adjacent.sum': 'Gira el cubo entero hacia un lado hasta que las aristas dobles intercambiadas queden delante y a la derecha. Haz el algoritmo de paridad de PLL y luego U2. Quedan tres aristas dobles fuera de sitio: termina con la Ub del paso 4 (versión 4x4 abajo), con la arista doble resuelta atrás.',
      't4.c.q4-pll-corners.name': 'Paridad de PLL: dos esquinas intercambiadas',
      't4.c.q4-pll-corners.tip': 'En el paso 3 (permutar esquinas) dos esquinas vecinas están intercambiadas mientras todas las aristas ya están bien. Las dos esquinas que no están intercambiadas forman los faros de siempre. En un 3x3 un intercambio de esquinas siempre viene con un intercambio de aristas, así que esto es paridad.',
      't4.c.q4-pll-corners.sum': 'Haz primero el paso normal de esquinas (T-perm, con los faros a la izquierda). Eso deja dos aristas dobles opuestas intercambiadas, que es el caso «Paridad de PLL: aristas dobles opuestas intercambiadas»: termina con él. Atajo: con los faros delante o atrás, haz primero el algoritmo de paridad de PLL y luego la T-perm con los faros a la izquierda.',
      't4.c.q4-pll-cycle.name': 'Paridad de PLL: aristas dobles en ciclo',
      't4.c.q4-pll-cycle.tip': 'En el paso 4 (permutar aristas), con las esquinas ya colocadas, las aristas dobles están fuera de sitio de una forma que no es Ua, Ub, H ni Z y que no es un solo intercambio (por ejemplo las cuatro en ciclo). Si ninguna Ua, Ub, H o Z resuelve tus aristas, tienes paridad.',
      't4.c.q4-pll-cycle.sum': 'Sostén el cubo como quieras. Haz el algoritmo de paridad de PLL una vez y luego U2. Ahora es un paso 4 normal: resuélvelo con la Ua, Ub, H o Z (H y Z en su versión 4x4; la Ua y la Ub con la arista doble resuelta atrás) y alinea la capa de arriba.'
    }
  };
  I18N.extend(STRINGS);

  function t(key, params) { return I18N.t(key, params); }
  function lazy(obj, prop, fn) { Object.defineProperty(obj, prop, { enumerable: true, get: fn }); }

  // ---- Cases ----
  var SET_ORDER = ['EO', 'OCLL', 'CP', 'EP', 'OLLP', 'PLLP'];
  var CASES = [];
  var UB4 = P.trainerAlg('ep-ub').alg4;

  // the 16 Trainer algorithms in their 4x4 form
  ALGS3.forEach(function (a3) {
    var tr = P.trainerAlg(a3.id);
    var c = { id: 'q4-' + a3.id, set: a3.set, alg: tr.alg4, mask: a3.mask, practice: true, changed: tr.changed, base: a3.id };
    lazy(c, 'setName', function () { return a3.setName; });
    lazy(c, 'name', function () { return a3.name; });
    lazy(c, 'tip', function () { return a3.tip; });
    lazy(c, 'note', function () { return c.changed ? t('t4.changed') : ''; });
    lazy(c, 'hold', function () { return ''; });
    CASES.push(c);
  });

  function parityCase(id, set, mask, alg, practice, shows) {
    var c = { id: id, set: set, alg: alg, mask: mask, practice: practice, changed: false, shows: shows || [] };
    lazy(c, 'setName', function () { return t('t4.set.' + set); });
    lazy(c, 'name', function () { return t('t4.c.' + id + '.name'); });
    lazy(c, 'tip', function () { return t('t4.c.' + id + '.tip'); });
    lazy(c, 'note', function () { return ''; });
    lazy(c, 'hold', function () { return practice ? t('t4.c.' + id + '.hold') : ''; });
    lazy(c, 'summary', function () { return practice ? '' : t('t4.c.' + id + '.sum'); });
    CASES.push(c);
    return c;
  }
  // The yellow cross set also has a Learn-only card for the odd counts (1 or 3 yellow dedges on top): the diagram is the 1-yellow case
  // (the one a 3x3 solver does not recognize); the steps are in the Notation tab and in the OLL parity set below.
  (function () {
    var eoSet = ALGS3.filter(function (a) { return a.set === 'EO'; })[0];
    var c = { id: 'q4-eo-odd', set: 'EO', alg: null, mask: 'eo', practice: false, changed: false, shows: [] };
    lazy(c, 'setName', function () { return eoSet.setName; });
    lazy(c, 'name', function () { return t('t4.c.q4-eo-odd.name'); });
    lazy(c, 'tip', function () { return t('t4.c.q4-eo-odd.tip'); });
    lazy(c, 'note', function () { return ''; });
    lazy(c, 'hold', function () { return ''; });
    lazy(c, 'summary', function () { return t('t4.c.q4-eo-odd.sum'); });
    CASES.push(c);
  })();
  parityCase('q4-oll-parity', 'OLLP', 'oll', P.ALGS.OLL_PARITY, true);
  // 1 yellow dedge on top, with the yellow dedge held at the back: OLL parity, a quarter turn, the 3x3 line algorithm (all verified in
  // tests/parity.test.js). The mask hides the corners: the line algorithm mixes them up and they do not matter for the cross.
  parityCase('q4-oll-parity-1', 'OLLP', 'eo', P.ALGS.OLL_PARITY + ' U ' + P.ALGS.EO_LINE, true);
  // the parity algorithm turns the top layer by 180 degrees: the closing U2 makes it a clean swap of the two dedges
  parityCase('q4-pll-opposite', 'PLLP', 'pll', P.ALGS.PLL_PARITY + ' U2', true);
  parityCase('q4-pll-adjacent', 'PLLP', 'pll', null, false, [
    { key: 't4.lbl.parity', alg: P.ALGS.PLL_PARITY + ' U2' },
    { key: 't4.lbl.ub', alg: UB4 },
  ]);
  parityCase('q4-pll-corners', 'PLLP', 'pll', null, false, [
    { key: 't4.lbl.tperm', alg: P.ALGS.TPERM },
    { key: 't4.lbl.parity', alg: P.ALGS.PLL_PARITY + ' U2' },
  ]);
  parityCase('q4-pll-cycle', 'PLLP', 'pll', null, false, [
    { key: 't4.lbl.parity', alg: P.ALGS.PLL_PARITY + ' U2' },
  ]);

  // Learn-only cases have no single algorithm, but the diagram still needs a state: it is the Parity4 case.
  var DIAGRAM_STATE = {
    'q4-eo-odd': 'oll-parity-1', 'q4-pll-adjacent': 'pll-adjacent', 'q4-pll-corners': 'pll-corners', 'q4-pll-cycle': 'pll-cycle',
  };

  function caseById(id) {
    for (var i = 0; i < CASES.length; i++) if (CASES[i].id === id) return CASES[i];
    return null;
  }

  var AUFS = ['', 'U', "U'", 'U2'];

  // State of the case as the diagram shows it: the algorithm applied backwards from a solved cube (yellow top, green front).
  function stateOf(c) {
    if (typeof c === 'string') c = caseById(c);
    if (c.alg) return Cube4.applyAlg(Cube4.solved('yellowTop'), Cube4.invertAlg(c.alg));
    return P.caseState(DIAGRAM_STATE[c.id]);
  }
  function viewOf(c) {
    if (typeof c === 'string') c = caseById(c);
    return Cube4.lastLayerView(stateOf(c), c.mask);
  }
  // Practice setup: inverse of the algorithm followed by an AUF (random unless one is given). Only for practice cases.
  function setupFor(c, auf) {
    if (typeof c === 'string') c = caseById(c);
    if (!c.practice) throw new Error('Learn-only case: no practice setup (' + c.id + ')');
    if (auf == null) auf = AUFS[Math.floor(Math.random() * 4)];
    return (Cube4.invertAlg(c.alg) + ' ' + auf).trim();
  }
  // 4x4 top-view diagram (svg string) of a last-layer view
  function svg(view) {
    var s = Cube3D.topSvg(view, 4, { title: t('trainer.diagram.aria'), colors: Cube4.COLORS });
    return s.replace('<svg ', '<svg class="ll" ');
  }

  var Trainer4 = {
    SET_ORDER: SET_ORDER,
    CASES: CASES,
    AUFS: AUFS,
    caseById: caseById,
    practiceCases: function () { return CASES.filter(function (c) { return c.practice; }); },
    stateOf: stateOf,
    viewOf: viewOf,
    setupFor: setupFor,
    svg: svg,
    // id of the case card in the Notation tab (4x4) that has the full steps of a Learn-only case, or null
    notationCase: function (id) { return DIAGRAM_STATE[id] || null; },
  };

  if (isNode) module.exports = Trainer4;
  else root.Trainer4 = Trainer4;
})(typeof window !== 'undefined' ? window : globalThis);
