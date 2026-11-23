(function (root) {
  'use strict';

  // Seccion 4x4 de la pestana Notacion: notacion de 4x4 (cara exterior, capa interior, movimiento ancho,
  // rotaciones), las dos ultimas aristas de la reduccion (js/edges4.js) y las dos paridades de la ultima capa (OLL y PLL).
  // Todo el contenido sale de los datos verificados de js/parity4.js y js/edges4.js (algoritmos, pasos, condiciones de agarre) y del motor js/cube4.js:
  // aqui solo hay textos y maquetacion; ningun algoritmo se escribe a mano.
  var isNode = typeof module !== 'undefined' && module.exports;
  var Cube4 = isNode ? require('./cube4.js') : root.Cube4;
  var Cube3D = isNode ? require('./cube3d.js') : root.Cube3D;
  var P = isNode ? require('./parity4.js') : root.Parity4;
  var ALGS3 = isNode ? require('./algs.js') : root.ALGS;
  var E2 = isNode ? require('./edges4.js') : root.Edges4;

  var SCHEME = 'yellowTop'; // amarillo arriba, verde al frente: igual que las posiciones del Entrenador
  var GROUPS = ['outer', 'inner', 'wide', 'wide3', 'rotation'];
  // D, L and B look reversed (you do not look at those faces): their cards carry the same explanation as the 3x3 tab
  var CALLOUTS = { D: true, L: true, B: true };

  // ---- Textos (clave 'n4.*', en ambos idiomas) ----
  var STRINGS = {
    en: {
      'n4.title': 'Solving a 4x4: notation and parity',
      'n4.lead': 'On a 4x4 you solve by reduction: first the centers, then you pair up the edges, and after that it plays like a 3x3 (4LLL for the last layer). Careful: six of the Trainer algorithms (the ones with r, f or M) have to be rewritten for a 4x4, and two last-layer cases can show up that are impossible on a 3x3: OLL parity and PLL parity. This page has the notation you need, the 4x4 version of every algorithm and a checked recipe for each case.',
      'n4.flow.title': 'Where parity fits',
      'n4.flow.1': 'Solve the centers and pair up the edges (reduction). A paired edge, made of two edge pieces, is called a dedge (double edge) on this page. If the last two edges do not pair up with slice moves, use the card "Last two edges" below.',
      'n4.flow.2': 'Solve it like a 3x3. For the last layer use the four steps of the Trainer: yellow cross, orient corners, permute corners, permute edges. Six of the sixteen Trainer algorithms are written with r, f or M for the 3x3 and do not work as written on a 4x4: the Trainer in 4x4 mode already shows their 4x4 version, and the card "Trainer algorithms on a 4x4" (below) lists them.',
      'n4.flow.3': 'If at one of those steps you see something that cannot happen on a 3x3, it is parity. The cards below tell you which one and how to fix it.',
      'n4.hold.title': 'How to hold the cube',
      'n4.hold.text': 'For the last layer hold the cube as in the Trainer: yellow center on top and green center facing you (orange on your right). The last-layer diagrams are seen from above: the bottom edge of the diagram is the side facing you. Each recipe says when to turn the whole cube sideways (a y rotation) before an algorithm.',
      'n4.hold.cap': 'Solved 4x4: yellow on top, green in front, orange on the right.',
      'n4.hold.alt': 'Solved 4x4 seen from the front: yellow on top (U), green in front (F), orange on the right (R).',

      'n4.not.title': 'Notation on a 4x4',
      'n4.not.lead': 'A 4x4 has two layers between each pair of opposite faces, so there are more kinds of move than on a 3x3. Each card shows the cube before the move (the layers that turn are highlighted and the arrows show where their stickers go) and after doing it once. The diagrams show the cube with yellow on top and green in front.',
      'n4.mod': "The modifiers are the same as on a 3x3: an apostrophe (X') is the opposite direction and a 2 after the move (X2) is a half turn.",
      'n4.warn.title': 'Careful with the lowercase r',
      'n4.warn.text': 'Many 4x4 tutorials write r, r2 or l for the inner slice only. In this app, in both modes, a lowercase r means Rw: the outer face and the inner slice together. So in this section the inner slice is always written 2R (or 2L) and wide moves are always written Rw (or Lw, Uw): never r. If you follow a tutorial that uses r, check whether it means one layer or two before you copy it.',
      'n4.kind.outer.title': 'Outer face: R, L, U, D, F, B',
      'n4.kind.outer.text': 'A capital letter alone turns only the outer face, exactly like on a 3x3.',
      'n4.kind.inner.title': 'Inner slice: 2R, 2L, 2U, 2D, 2F, 2B',
      'n4.kind.inner.text': 'A 2 before the letter turns only the inner slice next to that face. The outer faces stay put.',
      'n4.kind.wide.title': 'Wide move: Rw, Lw, Uw, Dw, Fw, Bw',
      'n4.kind.wide.text': 'A w after the letter turns two layers together: the outer face and the inner slice next to it.',
      'n4.kind.wide3.title': 'Three-layer wide move: 3Rw, 3Fw',
      'n4.kind.wide3.text': 'A 3 before the letter and a w after it turns three layers together: everything except the opposite face. It is what the r and f of the Trainer become on a 4x4.',
      'n4.kind.rotation.title': 'Whole-cube rotations: x, y, z',
      'n4.kind.rotation.text': 'x turns the whole cube like R, y like U and z like F. Nothing changes except how you hold the cube.',
      'n4.card.before': 'Before: arrows show where the highlighted stickers go',
      'n4.card.after': 'After {m}',
      'n4.alt.before': 'Solved 4x4 with the layers moved by {m} highlighted and arrows showing their direction.',
      'n4.alt.after': 'The solved 4x4 after doing {m} once.',
      'n4.equiv': 'Layers that turn together:',
      'n4.m.R.name': 'Right face', 'n4.m.U.name': 'Up face', 'n4.m.F.name': 'Front face', 'n4.m.B.name': 'Back face',
      'n4.m.D.name': 'Down face', 'n4.m.L.name': 'Left face', 'n4.m.Fw.name': 'Front face + inner slice',
      'n4.m.2R.name': 'Inner slice next to R', 'n4.m.2L.name': 'Inner slice next to L',
      'n4.m.Rw.name': 'Right face + inner slice', 'n4.m.Lw.name': 'Left face + inner slice', 'n4.m.Uw.name': 'Top face + inner slice',
      'n4.m.x.name': 'Whole cube, like R', 'n4.m.y.name': 'Whole cube, like U',
      'n4.m.3Rw.name': 'Right face + both inner slices', 'n4.m.3Fw.name': 'Front face + both inner slices',
      'n4.m.3Rw.x': 'Turn the right face and both inner slices together, in the same direction as R. Only the left face stays. The three right columns of the front face go UP.',
      'n4.m.3Rw.xp': 'The opposite: those three columns go DOWN.',
      'n4.m.3Rw.x2': 'Half turn of the three right layers.',
      'n4.m.3Fw.x': 'Turn the front face and both inner slices behind it together, clockwise as you see the front. Only the back face stays.',
      'n4.m.3Fw.xp': 'Counterclockwise, as you see it.',
      'n4.m.3Fw.x2': 'Half turn of the three front layers.',
      'n4.m.R.x': 'Turn only the outer right face clockwise, as seen from the right side. The right column of the front face goes UP.',
      "n4.m.R.xp": 'Counterclockwise as seen from the right side: that column goes DOWN.',
      'n4.m.R.x2': 'Half turn: that column ends up on the back.',
      'n4.m.U.x': 'Turn only the outer top face clockwise, as seen from above. The top row of the front face goes LEFT.',
      'n4.m.U.xp': 'Counterclockwise as seen from above: that row goes RIGHT.',
      'n4.m.U.x2': 'Half turn: that row ends up on the back.',
      'n4.m.F.x': 'Turn only the outer front face clockwise, exactly as you see it.',
      'n4.m.F.xp': 'Counterclockwise, exactly as you see it.',
      'n4.m.F.x2': 'Half turn of the front face.',
      'n4.m.B.x': 'Turn only the outer back face clockwise, as seen from behind. From your side it looks counterclockwise: the row of the top face that is farthest from you goes LEFT.',
      'n4.m.B.xp': 'The opposite: that row goes RIGHT.',
      'n4.m.B.x2': 'Half turn of the back face.',
      'n4.m.D.x': 'Turn only the outer bottom face clockwise, as seen from below. The bottom row of the front face goes RIGHT.',
      'n4.m.D.xp': 'Counterclockwise as seen from below: that row goes LEFT.',
      'n4.m.D.x2': 'Half turn: that row ends up on the back.',
      'n4.m.L.x': 'Turn only the outer left face clockwise, as seen from the left side. The left column of the front face goes DOWN.',
      'n4.m.L.xp': 'Counterclockwise as seen from the left side: that column goes UP.',
      'n4.m.L.x2': 'Half turn: that column ends up on the back.',
      'n4.m.Fw.x': 'Turn the front face and the inner slice right behind it together, clockwise as you see the front.',
      'n4.m.Fw.xp': 'Counterclockwise, as you see it.',
      'n4.m.Fw.x2': 'Half turn of the two front layers.',
      'n4.m.D.call': 'D, L and B look reversed compared with U, R and F because you are not looking at those faces. Clockwise is always judged looking straight at the face you turn: for D, from below. That is why D sends the front row to the right, the opposite of U.',
      'n4.m.L.call': 'D, L and B look reversed compared with U, R and F because you are not looking at those faces. Clockwise is always judged looking straight at the face you turn: for L, from the left side. That is why L sends the front column down, the opposite of R.',
      'n4.m.B.call': 'D, L and B look reversed compared with U, R and F because you are not looking at those faces. Clockwise is always judged looking straight at the face you turn: for B, from behind.',
      'n4.m.2R.x': 'Turn only the inner slice next to the right face, in the same direction as R. The second column from the right of the front face goes UP. The outer faces do not move.',
      'n4.m.2R.xp': 'The opposite: that column goes DOWN.',
      'n4.m.2R.x2': 'Half turn of that slice.',
      'n4.m.2L.x': 'Turn only the inner slice next to the left face, in the same direction as L. The second column from the left of the front face goes DOWN. The outer faces do not move.',
      'n4.m.2L.xp': 'The opposite: that column goes UP.',
      'n4.m.2L.x2': 'Half turn of that slice.',
      'n4.m.Rw.x': 'Turn the right face and the inner slice next to it together, in the same direction as R. The two right columns of the front face go UP.',
      'n4.m.Rw.xp': 'The opposite: those two columns go DOWN.',
      'n4.m.Rw.x2': 'Half turn of the two right layers.',
      'n4.m.Lw.x': 'Turn the left face and the inner slice next to it together, in the same direction as L. The two left columns of the front face go DOWN.',
      'n4.m.Lw.xp': 'The opposite: those two columns go UP.',
      'n4.m.Lw.x2': 'Half turn of the two left layers.',
      'n4.m.Uw.x': 'Turn the top face and the inner slice below it together, in the same direction as U. The two top rows of the front face go LEFT.',
      'n4.m.Uw.xp': 'The opposite: those two rows go RIGHT.',
      'n4.m.Uw.x2': 'Half turn of the two top layers.',
      'n4.m.x.x': 'Turn the whole cube in the same direction as R. The front face goes UP and ends up on top.',
      'n4.m.x.xp': 'The opposite: the front face goes DOWN.',
      'n4.m.x.x2': 'Half turn: the front face ends up on the back.',
      'n4.m.y.x': 'Turn the whole cube in the same direction as U. The front face goes LEFT.',
      'n4.m.y.xp': 'The opposite: the front face goes RIGHT.',
      'n4.m.y.x2': 'Half turn: the front face ends up on the back.',

      'n4.par.title': 'The two parity cases',
      'n4.par.lead': 'Both appear in the last layer and neither can happen on a 3x3. The recipes assume you solve the last layer with the four steps of the Trainer. The algorithms are written with inner slices (2R, 2L) and Uw, never with r.',
      'n4.par.which.title': 'Which case do I have?',
      'n4.par.which.oll-parity': 'Yellow cross step: 3 yellow dedges on top (the fourth one shows yellow on its side).',
      'n4.par.which.oll-parity-1': 'Yellow cross step: only 1 yellow dedge on top (the other three show yellow on their sides).',
      'n4.par.which.pll-opposite': 'Corners placed, two opposite dedges swapped, the other two correct.',
      'n4.par.which.pll-adjacent': 'Corners placed, two neighboring dedges swapped, the other two correct.',
      'n4.par.which.pll-corners': 'All edges correct, two neighboring corners swapped.',
      'n4.par.which.pll-cycle': 'Corners placed, the dedges out of place in a way that is not a Ua, Ub, H or Z and not a single swap (for example all four in a cycle).',
      'n4.par.limit': 'If, with the corners placed, your dedges match a Ua, Ub, H or Z, solve them as the Trainer says (with the 4x4 versions of H and Z). Any other odd arrangement is covered by the last card. A diagonal swap of two corners with all the edges solved is not covered here.',
      'n4.par.oll.title': 'OLL parity in the yellow cross step: two variants',
      'n4.par.oll.lead': 'In the yellow cross step, with the edges already paired, an odd number of yellow dedges on top is OLL parity: 1 or 3. Count them first and use the card that matches. Both use the same OLL parity algorithm, but the 1-yellow card turns the cube a different way and finishes with the line algorithm.',

      'n4.tr.title': 'Trainer algorithms on a 4x4',
      'n4.tr.lead': 'The 3x3 Trainer algorithms are written for a 3x3, where a lowercase r or f also turns the middle layer and M is the middle slice. On a 4x4 the middle is made of two inner slices, so six of the sixteen algorithms (the ones with r, f or M) break the centers and unpair dedges if you do them as written. The Trainer in 4x4 mode already shows them rewritten. To rewrite one yourself, replace the moves like this and it does exactly what it does on a 3x3:',
      'n4.tr.map.r': 'r becomes 3Rw (three layers, like R).',
      'n4.tr.map.f': 'f becomes 3Fw (three layers, like F).',
      'n4.tr.map.M': "M becomes 2L 2R'; M' becomes 2L' 2R; M2 becomes 2L2 2R2 (both inner slices turn like L).",
      'n4.tr.same': 'The other {n} algorithms of the Trainer only use R, U, F and D face turns and work as they are on a 4x4.',
      'n4.tr.trainer': 'Trainer (3x3):',
      'n4.tr.four': 'On a 4x4:',
      'n4.label.recognize': 'How to recognize it',
      'n4.label.alg': 'Algorithm',
      'n4.label.alg.part': 'Parity algorithm (only the first part: follow the numbered steps below)',
      'n4.label.steps': 'Steps',
      'n4.label.shortcut': 'Shortcut',
      'n4.alg.note.oll': 'In this algorithm 2R and 2L are only the inner slice (see the cards above). Do not replace them with r or Rw: the same sequence with two-layer moves also disturbs the corners.',
      'n4.alg.note.pll': 'In this algorithm 2R is only the inner slice and Uw is the two top layers (see the cards above). Do not replace 2R with r or Rw: the two-layer version breaks the middle layers.',
      'n4.cap.oll': 'The case seen from above. Gray stickers are not yellow. The bottom edge of the diagram is the side facing you.',
      'n4.cap.pll': 'The case seen from above. The bottom edge of the diagram is the side facing you.',
      'n4.cap.eo': 'The case seen from above. Gray stickers are not yellow. The corners are hidden because they do not matter here. The bottom edge of the diagram is the side facing you.',
      'n4.alt.case': 'Top view of the last layer of this case.',
      'n4.alt.step': 'Top view of the last layer after step {n}.',
      'n4.tag.oll': 'OLL', 'n4.tag.pll': 'PLL',

      'n4.c.oll-parity.title': 'OLL parity: 3 yellow dedges on top',
      'n4.c.oll-parity-1.title': 'OLL parity: only 1 yellow dedge on top',
      'n4.c.oll-parity.rec': 'In step 1 of the Trainer (yellow cross), with the edges already paired, count the dedges that show yellow on top. On a 3x3 it is always 0, 2 or 4. An odd number (1 or 3) is OLL parity. This card is for 3: the fourth dedge is flipped, so it shows yellow on its side. If you see only 1, use the next card.',
      'n4.c.oll-parity-1.rec': 'In step 1 of the Trainer (yellow cross), with the edges already paired, count the dedges that show yellow on top. If you see only 1 (the other three show yellow on their sides), it is OLL parity too. It looks like a different case, but it is fixed with the same algorithm, then a quarter turn of the top layer, then the line algorithm of step 1. The corners can be in any state: they do not matter here.',
      'n4.c.oll-parity.note': 'The algorithm flips the dedge at the front and leaves every other piece where it was, so the yellow cross is now complete. Next comes step 2 of the Trainer.',
      'n4.c.oll-parity-1.note': 'Why it works: with the yellow dedge at the back, the dedge at the front is one of the three flipped ones, and the algorithm flips only that one. Now two opposite dedges show yellow (front and back): a line, as in step 1 of the Trainer. The quarter turn makes the line horizontal, which is how the line algorithm needs it. That algorithm can leave the corners mixed up: that is normal, step 2 and the next steps deal with them. Do not hold the yellow dedge anywhere else: it does not give a line.',
      'n4.c.pll-opposite.title': 'PLL parity: two opposite dedges swapped',
      'n4.c.pll-opposite.rec': 'In step 4 of the Trainer (permute edges), with the corners already placed, two opposite dedges (front and back, or left and right) are in each other\'s place and the other two are correct. No 3x3 case looks like this: Ua and Ub move three edges, H and Z move four.',
      'n4.c.pll-adjacent.title': 'PLL parity: two neighboring dedges swapped',
      'n4.c.pll-adjacent.rec': 'In step 4 of the Trainer (permute edges), with the corners already placed, two dedges that are next to each other (for example front and right) are in each other\'s place and the other two are correct. A 3x3 never has just two edges swapped.',
      'n4.c.pll-corners.title': 'PLL parity: two neighboring corners swapped',
      'n4.c.pll-corners.rec': 'In step 3 of the Trainer (permute corners) two corners that are next to each other are swapped, while all the edges are already correct (each edge matches its centers). The two corners that are not swapped form the usual headlights (two corners of the same color on one side). On a 3x3 this cannot happen: a corner swap always comes with an edge swap.',
      'n4.c.pll-cycle.title': 'PLL parity: any other odd arrangement of dedges',
      'n4.c.pll-cycle.rec': 'In step 4 of the Trainer (permute edges), with the corners already placed, the dedges are out of place in a way that is not a Ua, Ub, H or Z and not a single swap. The usual one is all four dedges in a cycle: each dedge is in the place of the next one. A 3x3 never shows this. When in doubt, this is the rule: if no Ua, Ub, H or Z solves your edges, you have parity.',
      'n4.pre.cornersSolved': 'The recipe assumes the corners already match the centers of their sides (turn the top layer until they do).',
      'n4.pre.edgesSolved': 'The recipe assumes every edge already matches its centers.',

      'n4.step.hold.anyHold': 'Hold the cube any way you like: this recipe works from any side.',
      'n4.step.hold.flippedEdgeFront': 'Hold the cube so that the flipped dedge (the one that shows yellow on its side) is at the front.',
      'n4.step.hold.singleYellowBack': 'Turn the whole cube sideways (y) until the only yellow dedge is at the back, the farthest from you. The dedge at the front, the closest to you, then shows yellow on its front side.',
      'n4.step.hold.swappedEdgesFrontBack': 'Turn the whole cube sideways (y) until the two swapped dedges are at the front and at the back. Either of the two ways works.',
      'n4.step.hold.swappedEdgesFrontRight': 'Turn the whole cube sideways (y) until the two swapped dedges are at the front and on the right.',
      'n4.step.hold.headlightsFrontOrBack': 'Turn the whole cube sideways (y) until the headlights (two corners of the same color on one side) are at the front or at the back. They must not be on the left or right side.',
      'n4.step.hold.headlightsLeft': 'Turn the whole cube sideways (y) until the headlights are on the left face.',
      'n4.step.hold.solvedEdgeBack': 'Hold the cube with the solved edge at the back.',
      'n4.step.alg.oll': 'Do the OLL parity algorithm. It only flips this dedge: the yellow cross is complete.',
      'n4.step.alg.oll.1': 'Do the OLL parity algorithm. It only flips the dedge at the front, so now two dedges show yellow on top: the front one and the back one (a line).',
      'n4.step.alg.quarter': 'Turn the top layer a quarter turn so that the line goes from left to right (horizontal). Either direction works.',
      'n4.step.alg.line': 'Do the line algorithm of step 1 of the Trainer. The yellow cross is complete. Some corners may look mixed up: that is expected, step 2 and the next steps deal with them.',
      'n4.or': 'or',
      'n4.step.alg.pll': 'Do the PLL parity algorithm. Right after it the corners look turned half a turn and the left and right dedges look swapped as well: that is expected. Together with the half turn that follows, it swaps the front and back dedges, which puts them in place.',
      'n4.step.alg.pll.adj': 'Do the PLL parity algorithm. Right after it the corners look turned half a turn and the dedges look more mixed up than before: that is expected. After the half turn that follows, the corners are solved and three dedges are out of place.',
      'n4.step.alg.pll.short': 'Do the PLL parity algorithm. Right after it the corners look turned half a turn and the left and right dedges look swapped: that is expected. The T-perm in the next step fixes the corners and swaps those two dedges back.',
      'n4.step.alg.pll.any': 'Do the PLL parity algorithm once. Right after it the corners look turned half a turn: the half turn that follows puts them back.',
      'n4.step.alg.u2': 'Turn the top layer by half a turn.',
      'n4.step.auf': 'Turn the top layer to line it up (AUF). Here it is:',
      'n4.step.auf.none': 'The top layer is already lined up: no turn needed.',
      'n4.step.then.pll-opposite': 'The corners are now solved and two opposite dedges are swapped. That is the case "PLL parity: two opposite dedges swapped": continue with its steps.',
      'n4.step.3x3.OCLL': 'The yellow cross is complete: continue with step 2 of the Trainer ({setName}), as usual: {names}. The ones that use r need their 4x4 version, listed below; the others work as they are.',
      'n4.step.3x3.OCLL.alg4': '4x4 versions:',
      'n4.step.3x3.EPany': 'This is now a normal step 4 of the Trainer ({setName}): the corners are solved and the dedges are in one of its cases. In this example it is the {name}; yours can also be a Ua, Ub, H or Z (H and Z need their 4x4 version, see the card "Trainer algorithms on a 4x4").',
      'n4.step.3x3.CP': 'Do the normal corner step of the Trainer ({setName}): {name}.',
      'n4.step.3x3.EP': 'Three dedges are now out of place. Do step 4 of the Trainer ({setName}) with the {name}. The Ua does not solve this case.',
      'n4.shortcut.text': 'Same result without the separate corner step. Use it only with the headlights at the front or at the back: with the headlights on the left or right side the parity algorithm leaves an F-perm, which the T-perm does not solve.',
      'n4.next.oll': 'Next: step 2 of the Trainer (orient corners), then steps 3 and 4 as usual. PLL parity can still show up in step 3 or 4.',
      'n4.next.pll': 'Done: the last layer, and with it the whole cube, is solved.',

      'n4.e2.title': 'Last two edges (edge pairing)',
      'n4.e2.lead': 'This step belongs to the reduction stage, before the 3x3 stage. When only two edges are left to pair, slice moves cannot join them. The recipe below pairs both at once, whatever the arrangement: it was checked on all {n} possible arrangements of those two edges, and the ten finished pairs stay paired and the centers stay solved.',
      'n4.e2.when.title': 'When you need it',
      'n4.e2.when.text': 'Ten of the twelve edges are paired and the last two are not. An edge is made of two halves (two edge pieces, also called wings). In each of these two edges the two halves do not match (on the same face of the edge you see two different stickers), so there are four loose halves that belong together in pairs. Slice moves cannot join them: to bring two halves together you need a free place to put them, and here every other place already holds a finished pair.',
      'n4.e2.when.not': 'This is not parity. Parity shows up later, in the last layer (see the parity cards below). Here the only problem is that two edges are still unpaired.',
      'n4.e2.hold.title': 'How to hold the cube and bring the two edges to the front',
      'n4.e2.hold.1': 'Find the two edges that are not paired: the only ones whose two halves do not match (the two stickers on the same face of the edge are different colors).',
      'n4.e2.hold.2': 'Hold the cube so that one of them is the left vertical edge of the front face (the edge between the front and the left faces, called FL).',
      'n4.e2.hold.3': 'If the other one is already the right vertical edge of the front face (FR), you are ready. If not, look for where it is in the table and do those moves. They only turn outer faces, never inner slices, and they never move the left edge, so every pair and every center stays as it is. A place is named with the two faces its edge touches: UR is the edge between the top (U) and the right (R) faces.',
      'n4.e2.hold.cap': 'Ready: the two unpaired edges are the left and right vertical edges of the front face.',
      'n4.e2.hold.upside': 'You can also hold the cube upside down (a z2 rotation): the two edges are still on the left and right of the front face and the recipe works the same.',
      'n4.e2.setup.head': 'Where the other edge is, and what to do',
      'n4.e2.setup.none': 'Nothing to do',
      'n4.e2.rec.title': 'Which case do I have?',
      'n4.e2.rec.text': 'Look only at the front face. The two edges show four stickers there: upper left, lower left, upper right and lower right (the middle two rows of its left and right columns).',
      'n4.e2.rec.side': 'Case 1, side by side: the upper left and upper right stickers have the same color, and so do the lower left and lower right ones.',
      'n4.e2.rec.cross': 'Case 2, crossed: any other combination.',
      'n4.e2.rec.why': 'The halves that belong together have the same two colors (the sticker on the front and the one on the side). In Case 1 they are side by side at the same height, one on each edge. In Case 2 they are diagonal: one is high on one edge and the other is low on the other edge.',
      'n4.e2.cap.front': 'Seen straight on: the front face with the neighboring stickers next to it. Colored: the centers and the four halves of the two unpaired edges. Gray: other pieces, not needed here.',
      'n4.e2.cap.case.side': 'Case 1 example',
      'n4.e2.cap.case.cross': 'Case 2 example',
      'n4.e2.alt.case': 'Front view of the two unpaired edges of this case.',
      'n4.e2.alt.step': 'Front view after step {n}.',
      'n4.e2.tag.side': 'Case 1',
      'n4.e2.tag.cross': 'Case 2',
      'n4.e2.c.side.title': 'Case 1: matching halves side by side',
      'n4.e2.c.cross.title': 'Case 2: matching halves crossed',
      'n4.e2.c.side.rec': 'On the front face, the upper stickers match each other and the lower ones match each other.',
      'n4.e2.c.cross.rec': 'The front stickers do not match like that. First turn the right edge over: that makes it Case 1.',
      'n4.e2.alg.note': 'Dw is the bottom face and the inner slice next to it, turning together like D (clockwise as seen from below). Always write it Dw, never the one-letter short form. All the other moves are normal outer turns.',
      'n4.e2.dw.cap': 'Dw: the two bottom layers turn together.',
      'n4.e2.step.hold': 'Hold the cube so that the two unpaired edges are the left and right vertical edges of the front face (see the table above).',
      'n4.e2.step.swap': 'Do the algorithm. Right after it, other pieces of the cube are in different places (other pairs have moved, the corners are mixed up): that is expected. What matters is that the centers are solved and all twelve edges are paired.',
      'n4.e2.step.flip': 'Do these five outer turns. They turn the right edge over: its two halves swap places. The front now looks like Case 1.',
      'n4.e2.step.swap.then': 'Now it is Case 1: do its algorithm. Right after it, other pieces are in different places: that is expected. All twelve edges are now paired.',
      'n4.e2.next': 'Done: all 12 edges are paired. Next comes the 3x3 stage (cross, first layers, last layer); parity can still show up at the end of it.',
    },
    es: {
      'n4.title': 'Resolver un 4x4: notación y paridades',
      'n4.lead': 'En un 4x4 se resuelve por reducción: primero los centros, luego se emparejan las aristas y después se juega como un 3x3 (4LLL para la última capa). Ojo: seis de los algoritmos del Entrenador (los que llevan r, f o M) hay que reescribirlos para un 4x4, y en la última capa pueden aparecer dos casos que en un 3x3 son imposibles: la paridad de OLL y la paridad de PLL. Aquí tienes la notación que necesitas, la versión de 4x4 de cada algoritmo y una receta comprobada para cada caso.',
      'n4.flow.title': 'Dónde encajan las paridades',
      'n4.flow.1': 'Resuelve los centros y empareja las aristas (reducción). Una arista emparejada, formada por dos piezas de arista, se llama «arista doble» en esta página. Si las dos últimas aristas no se emparejan con movimientos de capa, usa la tarjeta «Las dos últimas aristas» de más abajo.',
      'n4.flow.2': 'Resuélvelo como un 3x3. Para la última capa usa los cuatro pasos del Entrenador: cruz amarilla, orientar esquinas, permutar esquinas y permutar aristas. Seis de los dieciséis algoritmos del Entrenador están escritos con r, f o M para el 3x3 y no funcionan tal cual en un 4x4: el Entrenador en modo 4x4 ya muestra su versión de 4x4 y la tarjeta «Algoritmos del Entrenador en un 4x4» (más abajo) los lista.',
      'n4.flow.3': 'Si en alguno de esos pasos ves algo que en un 3x3 no puede pasar, es una paridad. Las tarjetas de abajo te dicen cuál es y cómo arreglarla.',
      'n4.hold.title': 'Cómo sostener el cubo',
      'n4.hold.text': 'Para la última capa sostén el cubo como en el Entrenador: centro amarillo arriba y centro verde mirando hacia ti (el naranja queda a tu derecha). Los diagramas de la última capa se ven desde arriba: el borde de abajo del diagrama es el lado que te mira. Cada receta dice cuándo girar el cubo entero hacia un lado (rotación «y») antes de un algoritmo.',
      'n4.hold.cap': '4x4 resuelto: amarillo arriba, verde al frente, naranja a la derecha.',
      'n4.hold.alt': '4x4 resuelto visto de frente: amarillo arriba (U), verde al frente (F), naranja a la derecha (R).',

      'n4.not.title': 'Notación en un 4x4',
      'n4.not.lead': 'Un 4x4 tiene dos capas entre cada par de caras opuestas, así que hay más tipos de movimiento que en un 3x3. Cada tarjeta muestra el cubo antes del movimiento (las capas que giran están resaltadas y las flechas indican adónde van sus piezas) y después de hacerlo una vez. Los diagramas muestran el cubo con amarillo arriba y verde al frente.',
      'n4.mod': "Los modificadores son los mismos que en el 3x3: el apóstrofo (X') es el sentido contrario y un 2 después del movimiento (X2) es media vuelta.",
      'n4.warn.title': 'Cuidado con la r minúscula',
      'n4.warn.text': 'Muchos tutoriales de 4x4 escriben r, r2 o l para la capa interior sola. En esta app, en ambos modos, una r minúscula significa Rw: la cara exterior y la capa interior juntas. Por eso en esta sección la capa interior se escribe siempre 2R (o 2L) y los movimientos anchos siempre Rw (o Lw, Uw): nunca r. Si sigues un tutorial que usa r, comprueba si habla de una capa o de dos antes de copiarlo.',
      'n4.kind.outer.title': 'Cara exterior: R, L, U, D, F, B',
      'n4.kind.outer.text': 'Una letra mayúscula sola gira solo la cara exterior, igual que en un 3x3.',
      'n4.kind.inner.title': 'Capa interior: 2R, 2L, 2U, 2D, 2F, 2B',
      'n4.kind.inner.text': 'Un 2 antes de la letra gira solo la capa interior de esa cara. Las caras exteriores no se mueven.',
      'n4.kind.wide.title': 'Movimiento ancho: Rw, Lw, Uw, Dw, Fw, Bw',
      'n4.kind.wide.text': 'Una w después de la letra gira dos capas juntas: la cara exterior y la capa interior de al lado.',
      'n4.kind.wide3.title': 'Movimiento ancho de tres capas: 3Rw, 3Fw',
      'n4.kind.wide3.text': 'Un 3 antes de la letra y una w después gira tres capas juntas: todo menos la cara opuesta. Es en lo que se convierten la r y la f del Entrenador en un 4x4.',
      'n4.kind.rotation.title': 'Rotaciones del cubo entero: x, y, z',
      'n4.kind.rotation.text': 'x gira el cubo entero como R; «y», como U; z, como F. No cambia nada salvo cómo sostienes el cubo.',
      'n4.card.before': 'Antes: las flechas muestran adónde van las piezas resaltadas',
      'n4.card.after': 'Después de {m}',
      'n4.alt.before': '4x4 resuelto con las capas que mueve {m} resaltadas y flechas que muestran su dirección.',
      'n4.alt.after': 'El 4x4 resuelto después de hacer {m} una vez.',
      'n4.equiv': 'Capas que giran a la vez:',
      'n4.m.R.name': 'Cara derecha', 'n4.m.U.name': 'Cara de arriba', 'n4.m.F.name': 'Cara frontal', 'n4.m.B.name': 'Cara de atrás',
      'n4.m.D.name': 'Cara de abajo', 'n4.m.L.name': 'Cara izquierda', 'n4.m.Fw.name': 'Cara frontal + capa interior',
      'n4.m.2R.name': 'Capa interior junto a R', 'n4.m.2L.name': 'Capa interior junto a L',
      'n4.m.Rw.name': 'Cara derecha + capa interior', 'n4.m.Lw.name': 'Cara izquierda + capa interior', 'n4.m.Uw.name': 'Cara de arriba + capa interior',
      'n4.m.x.name': 'Cubo entero, como R', 'n4.m.y.name': 'Cubo entero, como U',
      'n4.m.3Rw.name': 'Cara derecha + las dos capas interiores', 'n4.m.3Fw.name': 'Cara frontal + las dos capas interiores',
      'n4.m.3Rw.x': 'Gira la cara derecha y las dos capas interiores juntas, en el mismo sentido que R. Solo se queda quieta la cara izquierda. Las tres columnas derechas de la cara frontal SUBEN.',
      'n4.m.3Rw.xp': 'Lo contrario: esas tres columnas BAJAN.',
      'n4.m.3Rw.x2': 'Media vuelta de las tres capas de la derecha.',
      'n4.m.3Fw.x': 'Gira la cara frontal y las dos capas interiores que tiene detrás juntas, en sentido horario tal como ves el frente. Solo se queda quieta la cara de atrás.',
      'n4.m.3Fw.xp': 'Antihorario, tal como lo ves.',
      'n4.m.3Fw.x2': 'Media vuelta de las tres capas de delante.',
      'n4.m.R.x': 'Gira solo la cara derecha exterior en sentido horario, visto desde la derecha. La columna derecha de la cara frontal SUBE.',
      'n4.m.R.xp': 'Antihorario visto desde la derecha: esa columna BAJA.',
      'n4.m.R.x2': 'Media vuelta: esa columna termina atrás.',
      'n4.m.U.x': 'Gira solo la cara de arriba exterior en sentido horario, visto desde arriba. La fila superior de la cara frontal se va a la IZQUIERDA.',
      'n4.m.U.xp': 'Antihorario visto desde arriba: esa fila se va a la DERECHA.',
      'n4.m.U.x2': 'Media vuelta: esa fila termina atrás.',
      'n4.m.F.x': 'Gira solo la cara frontal exterior en sentido horario, tal como la ves.',
      'n4.m.F.xp': 'Antihorario, tal como lo ves.',
      'n4.m.F.x2': 'Media vuelta de la cara frontal.',
      'n4.m.B.x': 'Gira solo la cara de atrás exterior en sentido horario, visto desde atrás. Desde tu lado parece antihorario: la fila de la cara de arriba más lejana a ti se va a la IZQUIERDA.',
      'n4.m.B.xp': 'Lo contrario: esa fila se va a la DERECHA.',
      'n4.m.B.x2': 'Media vuelta de la cara de atrás.',
      'n4.m.D.x': 'Gira solo la cara de abajo exterior en sentido horario, visto desde abajo. La fila inferior de la cara frontal se va a la DERECHA.',
      'n4.m.D.xp': 'Antihorario visto desde abajo: esa fila se va a la IZQUIERDA.',
      'n4.m.D.x2': 'Media vuelta: esa fila termina atrás.',
      'n4.m.L.x': 'Gira solo la cara izquierda exterior en sentido horario, visto desde el lado izquierdo. La columna izquierda de la cara frontal BAJA.',
      'n4.m.L.xp': 'Antihorario visto desde el lado izquierdo: esa columna SUBE.',
      'n4.m.L.x2': 'Media vuelta: esa columna termina atrás.',
      'n4.m.Fw.x': 'Gira la cara frontal junto con la capa interior que tiene justo detrás, en sentido horario tal como ves el frente.',
      'n4.m.Fw.xp': 'Antihorario, tal como lo ves.',
      'n4.m.Fw.x2': 'Media vuelta de las dos capas del frente.',
      'n4.m.D.call': 'D, L y B parecen al revés que U, R y F porque no estás mirando esas caras. «Horario» siempre se juzga mirando de frente la cara que giras: en D, desde abajo. Por eso D manda la fila frontal a la derecha, al revés que U.',
      'n4.m.L.call': 'D, L y B parecen al revés que U, R y F porque no estás mirando esas caras. «Horario» siempre se juzga mirando de frente la cara que giras: en L, desde el lado izquierdo. Por eso L baja la columna frontal, al revés que R.',
      'n4.m.B.call': 'D, L y B parecen al revés que U, R y F porque no estás mirando esas caras. «Horario» siempre se juzga mirando de frente la cara que giras: en B, desde atrás.',
      'n4.m.2R.x': 'Gira solo la capa interior junto a la cara derecha, en el mismo sentido que R. La segunda columna desde la derecha de la cara frontal SUBE. Las caras exteriores no se mueven.',
      'n4.m.2R.xp': 'Lo contrario: esa columna BAJA.',
      'n4.m.2R.x2': 'Media vuelta de esa capa.',
      'n4.m.2L.x': 'Gira solo la capa interior junto a la cara izquierda, en el mismo sentido que L. La segunda columna desde la izquierda de la cara frontal BAJA. Las caras exteriores no se mueven.',
      'n4.m.2L.xp': 'Lo contrario: esa columna SUBE.',
      'n4.m.2L.x2': 'Media vuelta de esa capa.',
      'n4.m.Rw.x': 'Gira la cara derecha junto con la capa interior que tiene al lado, en el mismo sentido que R. Las dos columnas derechas de la cara frontal SUBEN.',
      'n4.m.Rw.xp': 'Lo contrario: esas dos columnas BAJAN.',
      'n4.m.Rw.x2': 'Media vuelta de las dos capas de la derecha.',
      'n4.m.Lw.x': 'Gira la cara izquierda junto con la capa interior que tiene al lado, en el mismo sentido que L. Las dos columnas izquierdas de la cara frontal BAJAN.',
      'n4.m.Lw.xp': 'Lo contrario: esas dos columnas SUBEN.',
      'n4.m.Lw.x2': 'Media vuelta de las dos capas de la izquierda.',
      'n4.m.Uw.x': 'Gira la cara de arriba junto con la capa interior que tiene debajo, en el mismo sentido que U. Las dos filas superiores de la cara frontal se van a la IZQUIERDA.',
      'n4.m.Uw.xp': 'Lo contrario: esas dos filas se van a la DERECHA.',
      'n4.m.Uw.x2': 'Media vuelta de las dos capas de arriba.',
      'n4.m.x.x': 'Gira el cubo entero en el mismo sentido que R. La cara frontal SUBE y termina arriba.',
      'n4.m.x.xp': 'Lo contrario: la cara frontal BAJA.',
      'n4.m.x.x2': 'Media vuelta: la cara frontal termina atrás.',
      'n4.m.y.x': 'Gira el cubo entero en el mismo sentido que U. La cara frontal se va a la IZQUIERDA.',
      'n4.m.y.xp': 'Lo contrario: la cara frontal se va a la DERECHA.',
      'n4.m.y.x2': 'Media vuelta: la cara frontal termina atrás.',

      'n4.par.title': 'Los dos casos de paridad',
      'n4.par.lead': 'Los dos aparecen en la última capa y ninguno puede pasar en un 3x3. Las recetas suponen que resuelves la última capa con los cuatro pasos del Entrenador. Los algoritmos están escritos con capas interiores (2R, 2L) y Uw, nunca con r.',
      'n4.par.which.title': '¿Qué caso tengo?',
      'n4.par.which.oll-parity': 'Paso de la cruz amarilla: 3 aristas dobles amarillas arriba (la cuarta muestra amarillo de lado).',
      'n4.par.which.oll-parity-1': 'Paso de la cruz amarilla: solo 1 arista doble amarilla arriba (las otras tres muestran amarillo de lado).',
      'n4.par.which.pll-opposite': 'Esquinas colocadas, dos aristas dobles opuestas intercambiadas y las otras dos bien.',
      'n4.par.which.pll-adjacent': 'Esquinas colocadas, dos aristas dobles vecinas intercambiadas y las otras dos bien.',
      'n4.par.which.pll-corners': 'Todas las aristas bien, dos esquinas vecinas intercambiadas.',
      'n4.par.which.pll-cycle': 'Esquinas colocadas, aristas dobles mal colocadas de una forma que no es una Ua, Ub, H o Z ni un solo intercambio (por ejemplo las cuatro en un ciclo).',
      'n4.par.limit': 'Si, con las esquinas colocadas, tus aristas dobles coinciden con una Ua, Ub, H o Z, resuélvelas como dice el Entrenador (con las versiones de 4x4 de la H y la Z). Cualquier otra disposición impar la cubre la última tarjeta. Un intercambio en diagonal de dos esquinas con todas las aristas resueltas no está cubierto aquí.',
      'n4.par.oll.title': 'Paridad de OLL en el paso de la cruz amarilla: dos variantes',
      'n4.par.oll.lead': 'En el paso de la cruz amarilla, con las aristas ya emparejadas, un número impar de aristas dobles amarillas arriba es paridad de OLL: 1 o 3. Cuéntalas primero y usa la tarjeta que coincida. Las dos usan el mismo algoritmo de paridad de OLL, pero la de 1 arista amarilla gira el cubo de otra manera y termina con el algoritmo de la línea.',

      'n4.tr.title': 'Algoritmos del Entrenador en un 4x4',
      'n4.tr.lead': 'Los algoritmos del Entrenador del 3x3 están escritos para un 3x3, donde una r o f minúscula también gira la capa del medio y M es el corte del medio. En un 4x4 el medio son dos capas interiores, así que seis de los dieciséis algoritmos (los que llevan r, f o M) rompen los centros y desemparejan aristas dobles si los haces tal como están escritos. El Entrenador en modo 4x4 ya los muestra reescritos. Para reescribir uno tú mismo, cambia los movimientos así y hace exactamente lo mismo que en un 3x3:',
      'n4.tr.map.r': 'r pasa a ser 3Rw (tres capas, como R).',
      'n4.tr.map.f': 'f pasa a ser 3Fw (tres capas, como F).',
      'n4.tr.map.M': "M pasa a ser 2L 2R'; M' pasa a ser 2L' 2R; M2 pasa a ser 2L2 2R2 (las dos capas interiores giran como L).",
      'n4.tr.same': 'Los otros {n} algoritmos del Entrenador solo usan giros de cara R, U, F y D y funcionan tal cual en un 4x4.',
      'n4.tr.trainer': 'Entrenador (3x3):',
      'n4.tr.four': 'En un 4x4:',
      'n4.label.recognize': 'Cómo reconocerlo',
      'n4.label.alg': 'Algoritmo',
      'n4.label.alg.part': 'Algoritmo de paridad (solo la primera parte: sigue los pasos numerados de abajo)',
      'n4.label.steps': 'Pasos',
      'n4.label.shortcut': 'Atajo',
      'n4.alg.note.oll': 'En este algoritmo 2R y 2L son solo la capa interior (mira las tarjetas de arriba). No los cambies por r ni por Rw: la misma secuencia con movimientos de dos capas también desordena las esquinas.',
      'n4.alg.note.pll': 'En este algoritmo 2R es solo la capa interior y Uw son las dos capas de arriba (mira las tarjetas de arriba). No cambies 2R por r ni por Rw: la versión de dos capas rompe las capas del medio.',
      'n4.cap.oll': 'El caso visto desde arriba. Las piezas grises no son amarillas. El borde de abajo del diagrama es el lado que te mira.',
      'n4.cap.pll': 'El caso visto desde arriba. El borde de abajo del diagrama es el lado que te mira.',
      'n4.cap.eo': 'El caso visto desde arriba. Las piezas grises no son amarillas. Las esquinas están ocultas porque aquí no importan. El borde de abajo del diagrama es el lado que te mira.',
      'n4.alt.case': 'Vista desde arriba de la última capa de este caso.',
      'n4.alt.step': 'Vista desde arriba de la última capa después del paso {n}.',
      'n4.tag.oll': 'OLL', 'n4.tag.pll': 'PLL',

      'n4.c.oll-parity.title': 'Paridad de OLL: 3 aristas dobles amarillas arriba',
      'n4.c.oll-parity-1.title': 'Paridad de OLL: solo 1 arista doble amarilla arriba',
      'n4.c.oll-parity.rec': 'En el paso 1 del Entrenador (cruz amarilla), con las aristas ya emparejadas, cuenta las aristas dobles que muestran amarillo arriba. En un 3x3 son siempre 0, 2 o 4. Un número impar (1 o 3) es paridad de OLL. Esta tarjeta es para 3: la cuarta arista doble está volteada, así que muestra amarillo de lado. Si ves solo 1, usa la tarjeta siguiente.',
      'n4.c.oll-parity-1.rec': 'En el paso 1 del Entrenador (cruz amarilla), con las aristas ya emparejadas, cuenta las aristas dobles que muestran amarillo arriba. Si ves solo 1 (las otras tres muestran amarillo de lado), también es paridad de OLL. Parece otro caso, pero se arregla con el mismo algoritmo, un cuarto de vuelta de la capa de arriba y el algoritmo de la línea del paso 1. Las esquinas pueden estar de cualquier manera: aquí no importan.',
      'n4.c.oll-parity.note': 'El algoritmo voltea la arista doble de delante y deja todas las demás piezas donde estaban, así que la cruz amarilla queda completa. Sigue el paso 2 del Entrenador.',
      'n4.c.oll-parity-1.note': 'Por qué funciona: con la arista doble amarilla atrás, la de delante es una de las tres volteadas y el algoritmo voltea solo esa. Ahora dos aristas dobles opuestas muestran amarillo (delante y atrás): una línea, como en el paso 1 del Entrenador. El cuarto de vuelta deja la línea horizontal, que es como la necesita el algoritmo de la línea. Ese algoritmo puede dejar las esquinas desordenadas: es normal, el paso 2 y los siguientes se ocupan de ellas. No sostengas la arista doble amarilla en otro sitio: no da una línea.',
      'n4.c.pll-opposite.title': 'Paridad de PLL: dos aristas dobles opuestas intercambiadas',
      'n4.c.pll-opposite.rec': 'En el paso 4 del Entrenador (permutar aristas), con las esquinas ya colocadas, dos aristas dobles opuestas (delante y atrás, o izquierda y derecha) están cada una en el sitio de la otra y las otras dos están bien. Ningún caso del 3x3 se ve así: la Ua y la Ub mueven tres aristas y la H y la Z mueven cuatro.',
      'n4.c.pll-adjacent.title': 'Paridad de PLL: dos aristas dobles vecinas intercambiadas',
      'n4.c.pll-adjacent.rec': 'En el paso 4 del Entrenador (permutar aristas), con las esquinas ya colocadas, dos aristas dobles que están una junto a otra (por ejemplo delante y a la derecha) están cada una en el sitio de la otra y las otras dos están bien. Un 3x3 nunca tiene solo dos aristas intercambiadas.',
      'n4.c.pll-corners.title': 'Paridad de PLL: dos esquinas vecinas intercambiadas',
      'n4.c.pll-corners.rec': 'En el paso 3 del Entrenador (permutar esquinas) hay dos esquinas vecinas intercambiadas, mientras que todas las aristas ya están bien (cada arista coincide con sus centros). Las otras dos esquinas forman los faros de siempre (dos esquinas del mismo color en un lado). En un 3x3 esto no puede pasar: un intercambio de esquinas siempre viene con un intercambio de aristas.',
      'n4.c.pll-cycle.title': 'Paridad de PLL: cualquier otra disposición impar de aristas dobles',
      'n4.c.pll-cycle.rec': 'En el paso 4 del Entrenador (permutar aristas), con las esquinas ya colocadas, las aristas dobles están mal colocadas de una forma que no es una Ua, Ub, H o Z ni un solo intercambio. La habitual es la de las cuatro aristas dobles en un ciclo: cada una está en el sitio de la siguiente. Un 3x3 nunca muestra esto. Ante la duda, esta es la regla: si ninguna Ua, Ub, H o Z resuelve tus aristas, tienes paridad.',
      'n4.pre.cornersSolved': 'La receta supone que las esquinas ya coinciden con los centros de sus lados (gira la capa de arriba hasta que lo hagan).',
      'n4.pre.edgesSolved': 'La receta supone que todas las aristas ya coinciden con sus centros.',

      'n4.step.hold.anyHold': 'Sostén el cubo como quieras: esta receta funciona desde cualquier lado.',
      'n4.step.hold.flippedEdgeFront': 'Sostén el cubo de modo que la arista doble volteada (la que muestra amarillo de lado) quede delante.',
      'n4.step.hold.singleYellowBack': 'Gira el cubo entero hacia un lado (y) hasta que la única arista doble amarilla quede atrás, la más lejana a ti. La arista doble de delante, la más cercana, muestra entonces amarillo en su cara frontal.',
      'n4.step.hold.swappedEdgesFrontBack': 'Gira el cubo entero hacia un lado (rotación «y») hasta que las dos aristas dobles intercambiadas queden delante y atrás. Sirve cualquiera de las dos formas.',
      'n4.step.hold.swappedEdgesFrontRight': 'Gira el cubo entero hacia un lado (rotación «y») hasta que las dos aristas dobles intercambiadas queden delante y a la derecha.',
      'n4.step.hold.headlightsFrontOrBack': 'Gira el cubo entero hacia un lado (rotación «y») hasta que los faros (dos esquinas del mismo color en un lado) queden delante o atrás. No deben quedar a la izquierda ni a la derecha.',
      'n4.step.hold.headlightsLeft': 'Gira el cubo entero hacia un lado (rotación «y») hasta que los faros queden en la cara izquierda.',
      'n4.step.hold.solvedEdgeBack': 'Sostén el cubo con la arista resuelta atrás.',
      'n4.step.alg.oll': 'Haz el algoritmo de paridad de OLL. Solo voltea esta arista doble: la cruz amarilla queda completa.',
      'n4.step.alg.oll.1': 'Haz el algoritmo de paridad de OLL. Solo voltea la arista doble de delante, así que ahora dos aristas dobles muestran amarillo arriba: la de delante y la de atrás (una línea).',
      'n4.step.alg.quarter': 'Gira la capa de arriba un cuarto de vuelta para que la línea vaya de izquierda a derecha (horizontal). Sirve cualquiera de los dos sentidos.',
      'n4.step.alg.line': 'Haz el algoritmo de la línea del paso 1 del Entrenador. La cruz amarilla queda completa. Algunas esquinas pueden verse desordenadas: es lo esperado, el paso 2 y los siguientes se ocupan de ellas.',
      'n4.or': 'o',
      'n4.step.alg.pll': 'Haz el algoritmo de paridad de PLL. Justo después las esquinas parecen giradas media vuelta y las aristas dobles de la izquierda y la derecha parecen intercambiadas también: es lo esperado. Junto con la media vuelta que viene a continuación, intercambia las aristas dobles de delante y de atrás, y las deja en su sitio.',
      'n4.step.alg.pll.adj': 'Haz el algoritmo de paridad de PLL. Justo después las esquinas parecen giradas media vuelta y las aristas dobles parecen más desordenadas que antes: es lo esperado. Tras la media vuelta que viene a continuación, las esquinas quedan resueltas y tres aristas dobles fuera de sitio.',
      'n4.step.alg.pll.short': 'Haz el algoritmo de paridad de PLL. Justo después las esquinas parecen giradas media vuelta y las aristas dobles de la izquierda y la derecha parecen intercambiadas: es lo esperado. La T-perm del paso siguiente arregla las esquinas y devuelve esas dos aristas dobles a su sitio.',
      'n4.step.alg.pll.any': 'Haz el algoritmo de paridad de PLL una vez. Justo después las esquinas parecen giradas media vuelta: la media vuelta que viene a continuación las devuelve a su sitio.',
      'n4.step.alg.u2': 'Gira la capa de arriba media vuelta.',
      'n4.step.auf': 'Gira la capa de arriba para alinearla (AUF). Aquí es:',
      'n4.step.auf.none': 'La capa de arriba ya está alineada: no hace falta girar.',
      'n4.step.then.pll-opposite': 'Ahora las esquinas están resueltas y hay dos aristas dobles opuestas intercambiadas. Es el caso «Paridad de PLL: dos aristas dobles opuestas intercambiadas»: sigue sus pasos.',
      'n4.step.3x3.OCLL': 'La cruz amarilla está completa: sigue con el paso 2 del Entrenador ({setName}), como siempre: {names}. Los que llevan r necesitan su versión de 4x4, en la lista de abajo; los demás funcionan tal cual.',
      'n4.step.3x3.OCLL.alg4': 'Versiones de 4x4:',
      'n4.step.3x3.EPany': 'Ahora es un paso 4 normal del Entrenador ({setName}): las esquinas están resueltas y las aristas dobles están en uno de sus casos. En este ejemplo es la {name}; la tuya también puede ser una Ua, Ub, H o Z (la H y la Z necesitan su versión de 4x4, mira la tarjeta «Algoritmos del Entrenador en un 4x4»).',
      'n4.step.3x3.CP': 'Haz el paso normal de esquinas del Entrenador ({setName}): {name}.',
      'n4.step.3x3.EP': 'Ahora hay tres aristas dobles fuera de sitio. Haz el paso 4 del Entrenador ({setName}) con la {name}. La Ua no resuelve este caso.',
      'n4.shortcut.text': 'El mismo resultado sin el paso de esquinas por separado. Úsalo solo con los faros delante o atrás: con los faros a la izquierda o a la derecha, el algoritmo de paridad deja una F-perm, que la T-perm no resuelve.',
      'n4.next.oll': 'Después: paso 2 del Entrenador (orientar esquinas) y luego los pasos 3 y 4 como siempre. La paridad de PLL todavía puede aparecer en el paso 3 o 4.',
      'n4.next.pll': 'Listo: la última capa, y con ella todo el cubo, queda resuelta.',

      'n4.e2.title': 'Las dos últimas aristas (emparejar aristas)',
      'n4.e2.lead': 'Este paso es de la etapa de reducción, antes de la etapa de 3x3. Cuando solo quedan dos aristas por emparejar, los movimientos de capa no pueden unirlas. La receta de abajo empareja las dos a la vez, sea cual sea la disposición: se comprobó con las {n} disposiciones posibles de esas dos aristas, y las diez parejas terminadas siguen emparejadas y los centros siguen resueltos.',
      'n4.e2.when.title': 'Cuándo la necesitas',
      'n4.e2.when.text': 'Diez de las doce aristas están emparejadas y las dos últimas no. Una arista está formada por dos mitades (dos piezas de arista, también llamadas «wings»). En cada una de estas dos aristas las dos mitades no coinciden (en la misma cara de la arista ves dos pegatinas de colores distintos), así que quedan cuatro mitades sueltas que van juntas de dos en dos. Los movimientos de capa no pueden unirlas: para juntar dos mitades necesitas un sitio libre donde ponerlas, y aquí todos los demás sitios ya tienen una pareja terminada.',
      'n4.e2.when.not': 'Esto no es paridad. La paridad aparece más tarde, en la última capa (mira las tarjetas de paridad de abajo). Aquí el único problema es que quedan dos aristas sin emparejar.',
      'n4.e2.hold.title': 'Cómo sostener el cubo y llevar las dos aristas al frente',
      'n4.e2.hold.1': 'Busca las dos aristas que no están emparejadas: las únicas cuyas dos mitades no coinciden (las dos pegatinas de la misma cara de la arista son de colores distintos).',
      'n4.e2.hold.2': 'Sostén el cubo de modo que una de ellas sea la arista vertical izquierda de la cara frontal (la arista entre la cara frontal y la izquierda, llamada FL).',
      'n4.e2.hold.3': 'Si la otra ya es la arista vertical derecha de la cara frontal (FR), estás listo. Si no, busca dónde está en la tabla y haz esos movimientos. Solo giran caras exteriores, nunca capas interiores, y no mueven nunca la arista izquierda, así que todas las parejas y todos los centros se quedan como están. Un sitio se nombra con las dos caras que toca su arista: UR es la arista entre la cara de arriba (U) y la derecha (R).',
      'n4.e2.hold.cap': 'Listo: las dos aristas sin emparejar son las aristas verticales izquierda y derecha de la cara frontal.',
      'n4.e2.hold.upside': 'También puedes sostener el cubo boca abajo (una rotación z2): las dos aristas siguen a la izquierda y a la derecha de la cara frontal y la receta funciona igual.',
      'n4.e2.setup.head': 'Dónde está la otra arista y qué hacer',
      'n4.e2.setup.none': 'Nada que hacer',
      'n4.e2.rec.title': '¿Qué caso tengo?',
      'n4.e2.rec.text': 'Mira solo la cara frontal. Las dos aristas muestran ahí cuatro piezas de color: arriba a la izquierda, abajo a la izquierda, arriba a la derecha y abajo a la derecha (las dos filas del medio de sus columnas izquierda y derecha).',
      'n4.e2.rec.side': 'Caso 1, lado a lado: las piezas de arriba a la izquierda y arriba a la derecha tienen el mismo color, y las de abajo a la izquierda y abajo a la derecha también.',
      'n4.e2.rec.cross': 'Caso 2, cruzado: cualquier otra combinación.',
      'n4.e2.rec.why': 'Las mitades que van juntas tienen los mismos dos colores (la pieza del frente y la del lado). En el caso 1 están lado a lado, a la misma altura, una en cada arista. En el caso 2 están en diagonal: una está arriba en una arista y la otra abajo en la otra.',
      'n4.e2.cap.front': 'Vista de frente: la cara frontal con las piezas vecinas a su lado. En color: los centros y las cuatro mitades de las dos aristas sin emparejar. En gris: las demás piezas, que aquí no importan.',
      'n4.e2.cap.case.side': 'Ejemplo del caso 1',
      'n4.e2.cap.case.cross': 'Ejemplo del caso 2',
      'n4.e2.alt.case': 'Vista de frente de las dos aristas sin emparejar de este caso.',
      'n4.e2.alt.step': 'Vista de frente después del paso {n}.',
      'n4.e2.tag.side': 'Caso 1',
      'n4.e2.tag.cross': 'Caso 2',
      'n4.e2.c.side.title': 'Caso 1: mitades iguales lado a lado',
      'n4.e2.c.cross.title': 'Caso 2: mitades iguales cruzadas',
      'n4.e2.c.side.rec': 'En la cara frontal, las piezas de arriba coinciden entre sí y las de abajo también.',
      'n4.e2.c.cross.rec': 'Las piezas del frente no coinciden así. Primero da la vuelta a la arista derecha: así pasa a ser el caso 1.',
      'n4.e2.alg.note': 'Dw es la cara de abajo y la capa interior que tiene al lado, girando juntas como D (en sentido horario visto desde abajo). Escríbelo siempre Dw, nunca la forma corta de una letra. Todos los demás movimientos son giros normales de cara exterior.',
      'n4.e2.dw.cap': 'Dw: las dos capas de abajo giran juntas.',
      'n4.e2.step.hold': 'Sostén el cubo con las dos aristas sin emparejar como aristas verticales izquierda y derecha de la cara frontal (mira la tabla de arriba).',
      'n4.e2.step.swap': 'Haz el algoritmo. Justo después, otras piezas del cubo están en sitios distintos (otras parejas se han movido, las esquinas están revueltas): es lo esperado. Lo que importa es que los centros están resueltos y las doce aristas están emparejadas.',
      'n4.e2.step.flip': 'Haz estos cinco giros de cara exterior. Dan la vuelta a la arista derecha: sus dos mitades se intercambian. Ahora el frente se ve como en el caso 1.',
      'n4.e2.step.swap.then': 'Ahora es el caso 1: haz su algoritmo. Justo después, otras piezas están en sitios distintos: es lo esperado. Las doce aristas quedan emparejadas.',
      'n4.e2.next': 'Listo: las 12 aristas están emparejadas. Ahora viene la etapa de 3x3 (cruz, primeras capas, última capa); la paridad todavía puede aparecer al final.',
    },
  };

  if (root.I18N && root.I18N.extend) root.I18N.extend(STRINGS);

  function fill(s, params) {
    if (!params) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return params[k] != null ? String(params[k]) : m; });
  }
  // con lang explicito (o sin I18N, en Node) usa STRINGS; si no, I18N.t
  function t(key, params, lang) {
    if (!lang && root.I18N && root.I18N.t) return root.I18N.t(key, params);
    var l = lang || 'en';
    var s = (STRINGS[l] && STRINGS[l][key]) || STRINGS.en[key] || key;
    return fill(s, params);
  }
  function curLang() { return root.I18N && root.I18N.lang ? root.I18N.lang : 'en'; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // nombre / nombre de paso de un algoritmo del 3x3 en el idioma pedido (no el actual)
  function pickLang(obj, lang) { return obj[lang] !== undefined ? obj[lang] : obj.en; }
  function alg3(id) {
    for (var i = 0; i < ALGS3.length; i++) if (ALGS3[i].id === id) return ALGS3[i];
    throw new Error('Unknown 3x3 algorithm: ' + id);
  }

  // ---- Diagramas (cacheados por clave) ----
  var cache = {};
  function memo(key, fn) { return cache[key] || (cache[key] = fn()); }
  function primeOf(m) { return m + "'"; }
  function solved() { return Cube4.solved(SCHEME); }
  function afterState(m) { return Cube4.applyAlg(solved(), m); }

  function holdSvg(lang) {
    return memo('hold|' + lang, function () {
      return Cube3D.svg(solved(), { engine: Cube4, labels: true, size: 190, title: t('n4.hold.alt', null, lang) });
    });
  }
  function beforeSvg(m, lang) {
    return memo('b|' + m + '|' + lang, function () {
      return Cube3D.svg(solved(), { engine: Cube4, highlight: m, arrows: m, size: 170, title: t('n4.alt.before', { m: m }, lang) });
    });
  }
  function afterSvg(m, lang) {
    return memo('a|' + m + '|' + lang, function () {
      return Cube3D.svg(afterState(m), { engine: Cube4, size: 170, title: t('n4.alt.after', { m: m }, lang) });
    });
  }
  function topView(state, mask, title, size) {
    return Cube3D.topSvg(Cube4.lastLayerView(state, mask), Cube4.N, { colors: Cube4.COLORS, size: size, title: title });
  }
  function figure(svg, caption) {
    return '<figure class="nt-fig">' + svg + (caption ? '<figcaption>' + esc(caption) + '</figcaption>' : '') + '</figure>';
  }

  // ---- Tarjetas de notacion ----
  function moveCard(nv, lang) {
    var m = nv.move, T = function (k, p) { return t(k, p, lang); };
    var h = '<article class="card nt-card n4-card" data-move="' + esc(m) + '" data-kind="' + nv.kind + '">';
    h += '<header class="nt-card-head"><span class="nt-big">' + esc(m) + '</span><span class="nt-name">' + esc(T('n4.m.' + m + '.name')) + '</span></header>';
    h += '<div class="nt-figs">' + figure(beforeSvg(m, lang), T('n4.card.before')) + figure(afterSvg(m, lang), T('n4.card.after', { m: m })) + '</div>';
    h += '<ul class="nt-lines">' +
      '<li><b class="nt-mv">' + esc(m) + '</b> <span>' + esc(T('n4.m.' + m + '.x')) + '</span></li>' +
      '<li><b class="nt-mv">' + esc(primeOf(m)) + '</b> <span>' + esc(T('n4.m.' + m + '.xp')) + '</span></li>' +
      '<li><b class="nt-mv">' + esc(m + '2') + '</b> <span>' + esc(T('n4.m.' + m + '.x2')) + '</span></li></ul>';
    if (CALLOUTS[m]) h += '<p class="nt-callout" role="note">' + esc(T('n4.m.' + m + '.call')) + '</p>';
    if (nv.equiv) {
      h += '<p class="n4-equiv">' + esc(T('n4.equiv')) + ' <code>' + esc(nv.equiv.split(' ').join(' + ')) + '</code></p>';
    }
    return h + '</article>';
  }

  // ---- Recetas: se recorren los pasos verificados de P.CASES y se calcula el estado tras cada paso ----
  var ALG_KEY = {};
  ALG_KEY[P.ALGS.OLL_PARITY] = 'oll';
  ALG_KEY[P.ALGS.PLL_PARITY] = 'pll';
  ALG_KEY.U2 = 'u2';
  ALG_KEY.U = 'quarter';
  ALG_KEY[P.ALGS.EO_LINE] = 'line';

  // Paso EP de la app (sin predicado de agarre): escoge el giro y (0..3) y el algoritmo de la lista con los que el estado se
  // resuelve (con o sin AUF final). La Ua y la Ub piden la arista resuelta atras. -> {k, id, back} o null
  var NEEDS_BACK = { 'ep-ua': true, 'ep-ub': true };
  function pickEp(state, ids) {
    for (var j = 0; j < ids.length; j++) {
      for (var k = 0; k < 4; k++) {
        var st = P.rotateY(state, k), id = ids[j];
        if (NEEDS_BACK[id]) {
          var e = P.analyze(st).edges[2];
          if (!(e.paired && e.home === 2 && e.oriented)) continue;
        }
        if (P.aufSolve(Cube4.applyAlg(st, P.trainerAlg(id).alg4)) !== null) return { k: k, id: id, back: !!NEEDS_BACK[id] };
      }
    }
    return null;
  }

  // -> lista de {kind, state, ...}; una entrada por paso de la receta (los 'then' se expanden en linea)
  function walk(steps, state, out) {
    steps.forEach(function (s) {
      var ks, k, a;
      if (s.do === 'hold') {
        ks = P.holds(state, s.when);
        if (!ks.length) throw new Error('No hold satisfies ' + s.when);
        state = P.rotateY(state, ks[0]);
        out.push({ kind: 'hold', when: s.when, state: state });
      } else if (s.do === 'alg') {
        state = Cube4.applyAlg(state, s.alg);
        if (!ALG_KEY[s.alg]) throw new Error('No text for algorithm ' + s.alg);
        out.push({ kind: 'alg', alg: s.alg, alt: s.alt || null, key: ALG_KEY[s.alg], state: state });
      } else if (s.do === 'auf') {
        a = P.aufSolve(state);
        if (a === null) throw new Error('AUF does not solve');
        state = Cube4.applyAlg(state, a);
        out.push({ kind: 'auf', alg: a, state: state });
      } else if (s.do === 'then') {
        out.push({ kind: 'then', to: s.case, state: state });
        state = walk(P.caseById(s.case).steps, state, out);
      } else if (s.do === 'then3x3') {
        if (s.set === 'OCLL') {
          out.push({ kind: '3x3', set: 'OCLL', ids: s.algs.slice(), state: state });
        } else {
          var pick, hold;
          if (s.hold) {
            ks = P.holds(state, s.hold);
            if (!ks.length) throw new Error('No hold for ' + s.set);
            pick = { k: ks[0], id: s.algs[0] };
            hold = s.hold;
          } else {
            pick = pickEp(state, s.algs);
            if (!pick) throw new Error('No hold and algorithm for ' + s.set);
            hold = pick.back ? 'solvedEdgeBack' : null;
          }
          state = Cube4.applyAlg(P.rotateY(state, pick.k), P.trainerAlg(pick.id).alg4);
          out.push({ kind: '3x3', set: s.set, ids: [pick.id], hold: hold, state: state });
        }
      } else throw new Error('Unknown step ' + s.do);
    });
    return state;
  }

  function stepsFor(id, which) {
    var c = P.caseById(id), out = [];
    var end = walk(which === 'shortcut' ? c.shortcut : c.steps, P.caseState(id), out);
    if (!P.recipeDone(c, end)) { // the recipe ends with an AUF that its data leaves implicit (the T-perm of the shortcut)
      var a = P.aufSolve(end);
      if (a === null) throw new Error('Recipe of ' + id + ' does not end solved');
      out.push({ kind: 'auf', alg: a, state: Cube4.applyAlg(end, a) });
    }
    return out;
  }

  // data-step-alg: algorithm of the recipe (checked against Parity4.CASES / js/algs.js); data-auf: the U-turn that lines the layer up
  function algHtml(alg, attr) {
    return '<code class="n4-alg" data-' + (attr || 'step-alg') + '="' + esc(alg) + '">' + esc(alg) + '</code>';
  }

  // 4x4 forms of Trainer algorithms: [{name, alg}] as <ul>, each alg in data-alg4 (checked against Parity4.TRAINER)
  function alg4List(ids, lang) {
    var rows = ids.filter(function (id) { return P.trainerAlg(id).changed; });
    if (!rows.length) return '';
    return '<ul class="n4-alg4">' + rows.map(function (id) {
      return '<li><b>' + esc(pickLang(alg3(id).i18n.name, lang)) + '</b> ' + algHtml(P.trainerAlg(id).alg4, 'alg4') + '</li>';
    }).join('') + '</ul>';
  }

  // ctx: {id: id de la tarjeta, which: 'steps' | 'shortcut'}; escoge la variante del texto del algoritmo de paridad PLL
  function pllKey(ctx) {
    if (ctx.id === 'pll-adjacent') return 'n4.step.alg.pll.adj';
    if (ctx.id === 'pll-cycle') return 'n4.step.alg.pll.any';
    if (ctx.which === 'shortcut') return 'n4.step.alg.pll.short';
    return 'n4.step.alg.pll';
  }

  // text key of an algorithm step; the OLL parity algorithm reads differently in the 1-yellow recipe
  function algTextKey(it, ctx) {
    if (it.key === 'pll') return pllKey(ctx);
    if (it.key === 'oll' && ctx.id === 'oll-parity-1') return 'n4.step.alg.oll.1';
    return 'n4.step.alg.' + it.key;
  }

  function stepHtml(it, n, mask, lang, ctx) {
    var T = function (k, p) { return t(k, p, lang); };
    var body = '', setName;
    if (it.kind === 'hold') {
      body = '<p>' + esc(T('n4.step.hold.' + it.when)) + '</p>';
    } else if (it.kind === 'alg') {
      body = '<p>' + esc(T(algTextKey(it, ctx))) + '</p>' + (it.alt
        // two equivalent turns (checked in the tests): side by side, the second one in its own attribute
        ? '<div class="n4-orrow">' + algHtml(it.alg) + '<span class="n4-or">' + esc(T('n4.or')) + '</span>' + algHtml(it.alt, 'step-alg-alt') + '</div>'
        : algHtml(it.alg));
    } else if (it.kind === 'auf') {
      body = it.alg ? '<p>' + esc(T('n4.step.auf')) + '</p>' + algHtml(it.alg, 'auf') : '<p>' + esc(T('n4.step.auf.none')) + '</p>';
    } else if (it.kind === 'then') {
      body = '<p>' + esc(T('n4.step.then.' + it.to)) + '</p>';
    } else if (it.kind === '3x3') {
      var first = alg3(it.ids[0]);
      setName = pickLang(first.i18n.setName, lang).replace(/^\d+\s*·\s*/, '');
      if (it.set === 'OCLL') {
        body = '<p>' + esc(T('n4.step.3x3.OCLL', {
          setName: setName,
          names: it.ids.map(function (i) { return pickLang(alg3(i).i18n.name, lang); }).join(', '),
        })) + '</p>';
        var four = alg4List(it.ids, lang);
        if (four) body += '<p class="n4-sub">' + esc(T('n4.step.3x3.OCLL.alg4')) + '</p>' + four;
      } else {
        body = (it.hold ? '<p>' + esc(T('n4.step.hold.' + it.hold)) + '</p>' : '') + '<p>' +
          esc(T('n4.step.3x3.' + it.set, { setName: setName, name: pickLang(first.i18n.name, lang) })) + '</p>' + algHtml(P.trainerAlg(first.id).alg4);
      }
    }
    var fig = '<figure class="n4-step-fig">' + topView(it.state, mask, T('n4.alt.step', { n: n }), 96) + '</figure>';
    return '<li class="n4-step" data-step="' + it.kind + '"><div class="n4-step-body">' + body + '</div>' + fig + '</li>';
  }

  function stepList(items, mask, lang, ctx) {
    return '<ol class="n4-steps">' + items.map(function (it, i) { return stepHtml(it, i + 1, mask, lang, ctx); }).join('') + '</ol>';
  }

  function caseCard(c, lang) {
    var T = function (k, p) { return t(k, p, lang); };
    var main = stepsFor(c.id, 'steps');
    var parity = main.filter(function (it) { return it.kind === 'alg' && it.key !== 'u2'; })[0];
    var h = '<article class="card n4-case" data-case="' + c.id + '">';
    h += '<header class="n4-case-head"><h4>' + esc(T('n4.c.' + c.id + '.title')) + '</h4><span class="chip n4-tag">' + esc(T('n4.tag.' + c.step)) + '</span></header>';
    h += '<div class="n4-case-top"><figure class="nt-fig n4-case-fig">' +
      topView(P.caseState(c.id), c.mask, T('n4.alt.case'), 150) +
      '<figcaption>' + esc(T('n4.cap.' + c.mask)) + '</figcaption></figure><div class="n4-case-text">' +
      '<p><b>' + esc(T('n4.label.recognize')) + '.</b> ' + esc(T('n4.c.' + c.id + '.rec')) + '</p>';
    (c.pre || []).forEach(function (p) { h += '<p class="n4-pre">' + esc(T('n4.pre.' + p)) + '</p>'; });
    h += '</div></div>';
    h += '<div class="n4-algbox"><span class="n4-label">' + esc(T(c.id === 'oll-parity-1' ? 'n4.label.alg.part' : 'n4.label.alg')) + '</span>' +
      '<code class="n4-big" data-alg="' + esc(parity.alg) + '">' + esc(parity.alg) + '</code>' +
      '<p class="n4-algnote">' + esc(T('n4.alg.note.' + c.step)) + '</p></div>';
    if (c.step === 'oll') h += '<div class="nt-callout n4-note" role="note"><p>' + esc(T('n4.c.' + c.id + '.note')) + '</p></div>';
    h += '<h5 class="n4-label">' + esc(T('n4.label.steps')) + '</h5>' + stepList(main, c.mask, lang, { id: c.id, which: 'steps' });
    if (c.shortcut) {
      h += '<details class="n4-shortcut"><summary>' + esc(T('n4.label.shortcut')) + '</summary><p>' + esc(T('n4.shortcut.text')) + '</p>' +
        stepList(stepsFor(c.id, 'shortcut'), c.mask, lang, { id: c.id, which: 'shortcut' }) + '</details>';
    }
    h += '<p class="n4-next">' + esc(T(c.step === 'oll' ? 'n4.next.oll' : 'n4.next.pll')) + '</p>';
    return h + '</article>';
  }

  // Tarjeta "Algoritmos del Entrenador en un 4x4": los seis que llevan r, f o M, con su version de 4x4
  function trainerCard(lang) {
    var T = function (k, p) { return t(k, p, lang); };
    var changed = P.TRAINER.filter(function (x) { return x.changed; });
    var h = '<section class="card n4-tr" id="n4-tr"><h4>' + esc(T('n4.tr.title')) + '</h4><p>' + esc(T('n4.tr.lead')) + '</p>';
    h += '<ul class="n4-list n4-map">' + ['r', 'f', 'M'].map(function (k) { return '<li>' + esc(T('n4.tr.map.' + k)) + '</li>'; }).join('') + '</ul>';
    h += '<ul class="n4-trlist">' + changed.map(function (x) {
      var a = alg3(x.id);
      return '<li data-id="' + x.id + '"><div class="n4-trhead"><b>' + esc(pickLang(a.i18n.name, lang)) + '</b> <span class="muted">' +
        esc(pickLang(a.i18n.setName, lang)) + '</span></div>' +
        '<div class="n4-trrow"><span class="n4-label">' + esc(T('n4.tr.trainer')) + '</span> <code class="n4-alg n4-old" data-alg3="' + esc(x.alg3) + '">' + esc(x.alg3) + '</code></div>' +
        '<div class="n4-trrow"><span class="n4-label">' + esc(T('n4.tr.four')) + '</span> ' + algHtml(x.alg4, 'alg4') + '</div></li>';
    }).join('') + '</ul>';
    h += '<p class="nt-note">' + esc(T('n4.tr.same', { n: P.TRAINER.length - changed.length })) + '</p></section>';
    return h;
  }

  // ---- Las dos ultimas aristas (js/edges4.js): hold, reconocimiento, recetas ----
  // Vista de frente (Cube3D.topSvg): la cara frontal y, alrededor, las piezas vecinas. `keep`: ids que se pintan (si no, gris).
  function frontSvg(state, keep, title, size) {
    return Cube3D.topSvg(E2.frontView(state, keep), Cube4.N, { colors: Cube4.COLORS, size: size, title: title });
  }
  function e2Run(id) { return E2.run(E2.exampleState(id)); }

  // pasos de la receta de un caso: [{kind: 'hold'|'alg', alg, key, state, tracked}] a partir de los datos verificados
  function e2Steps(id) {
    var r = e2Run(id);
    var out = [{ kind: 'hold', state: r.start.state, tracked: r.start.tracked }];
    r.steps.forEach(function (s, k) {
      var key = s.alg === E2.ALGS.FLIP ? 'flip' : (k > 0 ? 'swap.then' : 'swap');
      out.push({ kind: 'alg', alg: s.alg, key: key, state: s.state, tracked: s.tracked });
    });
    return out;
  }

  function e2StepHtml(it, n, lang) {
    var T = function (k, p) { return t(k, p, lang); };
    var body = it.kind === 'hold'
      ? '<p>' + esc(T('n4.e2.step.hold')) + '</p>'
      : '<p>' + esc(T('n4.e2.step.' + it.key)) + '</p>' + algHtml(it.alg);
    var fig = '<figure class="n4-step-fig">' + frontSvg(it.state, it.tracked, T('n4.e2.alt.step', { n: n }), 96) + '</figure>';
    return '<li class="n4-step" data-step="' + it.kind + '"><div class="n4-step-body">' + body + '</div>' + fig + '</li>';
  }

  function e2CaseCard(id, lang) {
    var T = function (k, p) { return t(k, p, lang); };
    var items = e2Steps(id), st = items[0];
    var whole = E2.caseById(id).steps.map(function (s) { return s.alg; }).join(' ');
    var h = '<article class="card n4-case n4-e2-case" data-e2case="' + id + '">';
    h += '<header class="n4-case-head"><h4>' + esc(T('n4.e2.c.' + id + '.title')) + '</h4><span class="chip n4-tag">' + esc(T('n4.e2.tag.' + id)) + '</span></header>';
    h += '<div class="n4-case-top"><figure class="nt-fig n4-case-fig">' + frontSvg(st.state, st.tracked, T('n4.e2.alt.case'), 150) +
      '<figcaption>' + esc(T('n4.e2.cap.case.' + id)) + '</figcaption></figure><div class="n4-case-text"><p><b>' +
      esc(T('n4.label.recognize')) + '.</b> ' + esc(T('n4.e2.c.' + id + '.rec')) + '</p></div></div>';
    h += '<div class="n4-algbox"><span class="n4-label">' + esc(T('n4.label.alg')) + '</span>' +
      '<code class="n4-big" data-e2alg="' + esc(whole) + '">' + esc(whole) + '</code>' +
      '<div class="n4-e2-dw"><figure class="nt-fig n4-dw-fig">' + beforeSvg('Dw', lang) + '<figcaption>' + esc(T('n4.e2.dw.cap')) + '</figcaption></figure>' +
      '<p class="n4-algnote">' + esc(T('n4.e2.alg.note')) + '</p></div></div>';
    h += '<h5 class="n4-label">' + esc(T('n4.label.steps')) + '</h5><ol class="n4-steps">' +
      items.map(function (it, i) { return e2StepHtml(it, i + 1, lang); }).join('') + '</ol>';
    h += '<p class="n4-next">' + esc(T('n4.e2.next')) + '</p>';
    return h + '</article>';
  }

  function e2Section(lang) {
    var T = function (k, p) { return t(k, p, lang); };
    var h = '<h3 class="nt-sec" id="n4-e2">' + esc(T('n4.e2.title')) + '</h3><p class="nt-lead">' +
      esc(T('n4.e2.lead', { n: E2.SITUATIONS.length })) + '</p>';
    h += '<section class="card n4-e2-when"><h4>' + esc(T('n4.e2.when.title')) + '</h4><p>' + esc(T('n4.e2.when.text')) +
      '</p><p class="nt-callout n4-note" role="note">' + esc(T('n4.e2.when.not')) + '</p></section>';

    var ex = e2Steps('cross')[0];
    h += '<section class="card n4-e2-hold"><h4>' + esc(T('n4.e2.hold.title')) + '</h4><div class="n4-case-top"><div class="n4-case-text"><ol class="n4-list">' +
      [1, 2, 3].map(function (i) { return '<li>' + esc(T('n4.e2.hold.' + i)) + '</li>'; }).join('') + '</ol></div>' +
      '<figure class="nt-fig n4-case-fig">' + frontSvg(ex.state, ex.tracked, T('n4.e2.alt.case'), 150) + '<figcaption>' + esc(T('n4.e2.hold.cap')) + '</figcaption></figure></div>';
    h += '<h5 class="n4-label">' + esc(T('n4.e2.setup.head')) + '</h5><ul class="n4-setup">' + E2.SETUP.table.map(function (r) {
      return '<li data-at="' + r.at + '"><span class="n4-at">' + r.at + '</span>' +
        (r.moves ? '<code class="n4-alg" data-setup="' + esc(r.moves) + '">' + esc(r.moves) + '</code>' : '<span class="n4-none">' + esc(T('n4.e2.setup.none')) + '</span>') + '</li>';
    }).join('') + '</ul><p class="nt-note">' + esc(T('n4.e2.hold.upside')) + '</p></section>';

    h += '<section class="card n4-e2-rec"><h4>' + esc(T('n4.e2.rec.title')) + '</h4><p>' + esc(T('n4.e2.rec.text')) + '</p><div class="nt-figs">' +
      ['side', 'cross'].map(function (id) {
        var s0 = e2Steps(id)[0];
        return '<figure class="nt-fig">' + frontSvg(s0.state, s0.tracked, T('n4.e2.alt.case'), 130) + '<figcaption>' + esc(T('n4.e2.cap.case.' + id)) + '</figcaption></figure>';
      }).join('') + '</div><ul class="n4-list"><li>' + esc(T('n4.e2.rec.side')) + '</li><li>' + esc(T('n4.e2.rec.cross')) + '</li></ul>' +
      '<p class="nt-note">' + esc(T('n4.e2.rec.why')) + '</p><p class="nt-note">' + esc(T('n4.e2.cap.front')) + '</p></section>';

    E2.RECIPE.cases.forEach(function (c) { h += e2CaseCard(c.id, lang); });
    return h;
  }

  function build(lang) {
    lang = lang || curLang();
    return memo('html|' + lang, function () {
      var T = function (k, p) { return t(k, p, lang); };
      var h = '<h2 class="nt-title">' + esc(T('n4.title')) + '</h2><p class="nt-lead">' + esc(T('n4.lead')) + '</p>';

      h += '<section class="card n4-flow"><h3>' + esc(T('n4.flow.title')) + '</h3><ol class="n4-list">' +
        [1, 2, 3].map(function (i) { return '<li>' + esc(T('n4.flow.' + i)) + '</li>'; }).join('') + '</ol></section>';

      h += '<section class="card nt-hold"><h3>' + esc(T('n4.hold.title')) + '</h3><div class="nt-hold-body"><div class="nt-hold-text"><p>' +
        esc(T('n4.hold.text')) + '</p></div><div class="nt-figs">' + figure(holdSvg(lang), T('n4.hold.cap')) + '</div></div></section>';

      h += '<h3 class="nt-sec">' + esc(T('n4.not.title')) + '</h3><p class="nt-lead">' + esc(T('n4.not.lead')) + '</p>';
      h += '<section class="card nt-mods"><ul class="nt-lines n4-kinds">' + GROUPS.map(function (g) {
        return '<li><span><b>' + esc(T('n4.kind.' + g + '.title')) + '</b> ' + esc(T('n4.kind.' + g + '.text')) + '</span></li>';
      }).join('') + '</ul><p class="nt-note">' + esc(T('n4.mod')) + '</p></section>';
      h += '<p class="nt-callout n4-warn" role="note"><b>' + esc(T('n4.warn.title')) + '.</b> ' + esc(T('n4.warn.text')) + '</p>';
      GROUPS.forEach(function (g) {
        var list = P.NOTATION.filter(function (nv) { return nv.kind === g; });
        if (!list.length) return;
        h += '<h4 class="n4-group">' + esc(T('n4.kind.' + g + '.title')) + '</h4><div class="nt-grid">';
        list.forEach(function (nv) { h += moveCard(nv, lang); });
        h += '</div>';
      });

      h += e2Section(lang);

      h += trainerCard(lang);

      h += '<h3 class="nt-sec">' + esc(T('n4.par.title')) + '</h3><p class="nt-lead">' + esc(T('n4.par.lead')) + '</p>';
      h += '<section class="card n4-which"><h4>' + esc(T('n4.par.which.title')) + '</h4><ul class="n4-list">' +
        P.CASES.map(function (c) {
          return '<li><b>' + esc(T('n4.c.' + c.id + '.title')) + '.</b> ' + esc(T('n4.par.which.' + c.id)) + '</li>';
        }).join('') + '</ul><p class="nt-note">' + esc(T('n4.par.limit')) + '</p></section>';
      var seenOll = false;
      P.CASES.forEach(function (c) {
        if (c.step === 'oll' && !seenOll) { // both OLL parity cards share one heading
          seenOll = true;
          h += '<h4 class="n4-group">' + esc(T('n4.par.oll.title')) + '</h4><p class="nt-lead">' + esc(T('n4.par.oll.lead')) + '</p>';
        }
        h += caseCard(c, lang);
      });
      return h;
    });
  }

  var Notation4View = {
    STRINGS: STRINGS,
    NOTATION: P.NOTATION,
    CASES: P.CASES,
    CALLOUTS: CALLOUTS,
    afterState: afterState,
    stepsFor: stepsFor,
    e2Steps: e2Steps,
    build: build,
  };

  if (isNode) module.exports = Notation4View;
  else root.Notation4View = Notation4View;
})(typeof window !== 'undefined' ? window : globalThis);
