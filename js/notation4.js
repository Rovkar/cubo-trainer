(function (root) {
  'use strict';

  // Seccion 4x4 de la pestana Notacion: notacion de 4x4 (cara exterior, capa interior, movimiento ancho,
  // rotaciones) y las dos paridades de la ultima capa (OLL y PLL). Todo el contenido sale de los datos
  // verificados de js/parity4.js (algoritmos, pasos, condiciones de agarre) y del motor js/cube4.js:
  // aqui solo hay textos y maquetacion; ningun algoritmo se escribe a mano.
  var isNode = typeof module !== 'undefined' && module.exports;
  var Cube4 = isNode ? require('./cube4.js') : root.Cube4;
  var Cube3D = isNode ? require('./cube3d.js') : root.Cube3D;
  var P = isNode ? require('./parity4.js') : root.Parity4;
  var ALGS3 = isNode ? require('./algs.js') : root.ALGS;

  var SCHEME = 'yellowTop'; // amarillo arriba, verde al frente: igual que las posiciones del Entrenador
  var GROUPS = ['outer', 'inner', 'wide', 'wide3', 'rotation'];

  // ---- Textos (clave 'n4.*', en ambos idiomas) ----
  var STRINGS = {
    en: {
      'n4.title': 'Solving a 4x4: notation and parity',
      'n4.lead': 'On a 4x4 you solve by reduction: first the centers, then you pair up the edges, and after that it plays like a 3x3 (4LLL for the last layer). Careful: six of the Trainer algorithms (the ones with r, f or M) have to be rewritten for a 4x4, and two last-layer cases can show up that are impossible on a 3x3: OLL parity and PLL parity. This page has the notation you need, the 4x4 version of every algorithm and a checked recipe for each case.',
      'n4.flow.title': 'Where parity fits',
      'n4.flow.1': 'Solve the centers and pair up the edges (reduction). A paired edge, made of two edge pieces, is called a dedge (double edge) on this page.',
      'n4.flow.2': 'Solve it like a 3x3. For the last layer use the four steps of the Trainer: yellow cross, orient corners, permute corners, permute edges. Six of the sixteen Trainer algorithms use r, f or M and do not work as written on a 4x4: use their 4x4 version (card "Trainer algorithms on a 4x4", below).',
      'n4.flow.3': 'If at one of those steps you see something that cannot happen on a 3x3, it is parity. The cards below tell you which one and how to fix it.',
      'n4.hold.title': 'How to hold the cube',
      'n4.hold.text': 'For the last layer hold the cube as in the Trainer: yellow center on top and green center facing you (orange on your right). The last-layer diagrams are seen from above: the bottom edge of the diagram is the side facing you. Each recipe says when to turn the whole cube sideways (a y rotation) before an algorithm.',
      'n4.hold.cap': 'Solved 4x4: yellow on top, green in front, orange on the right.',
      'n4.hold.alt': 'Solved 4x4 seen from the front: yellow on top (U), green in front (F), orange on the right (R).',

      'n4.not.title': 'Notation on a 4x4',
      'n4.not.lead': 'A 4x4 has two layers between each pair of opposite faces, so there are more kinds of move than on a 3x3. Each card shows the cube before the move (the layers that turn are highlighted and the arrows show where their stickers go) and after doing it once. The diagrams show the cube with yellow on top and green in front.',
      'n4.mod': "The modifiers are the same as on a 3x3: an apostrophe (X') is the opposite direction and a 2 after the move (X2) is a half turn.",
      'n4.warn.title': 'Careful with the lowercase r',
      'n4.warn.text': 'Many 4x4 tutorials write r, r2 or l for the inner slice only. In this app (Notation tab, 3x3) a lowercase r means Rw: the outer face and the inner slice together. So in this section the inner slice is always written 2R (or 2L) and wide moves are always written Rw (or Lw, Uw): never r. If you follow a tutorial that uses r, check whether it means one layer or two before you copy it.',
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
      'n4.par.which.oll-parity': 'Yellow cross step: 1 or 3 yellow dedges on top.',
      'n4.par.which.pll-opposite': 'Corners placed, two opposite dedges swapped, the other two correct.',
      'n4.par.which.pll-adjacent': 'Corners placed, two neighboring dedges swapped, the other two correct.',
      'n4.par.which.pll-corners': 'All edges correct, two neighboring corners swapped.',
      'n4.par.which.pll-cycle': 'Corners placed, the dedges out of place in a way that is not a Ua, Ub, H or Z and not a single swap (for example all four in a cycle).',
      'n4.par.limit': 'If, with the corners placed, your dedges match a Ua, Ub, H or Z, solve them as the Trainer says (with the 4x4 versions of H and Z). Any other odd arrangement is covered by the last card. A diagonal swap of two corners with all the edges solved is not covered here.',

      'n4.tr.title': 'Trainer algorithms on a 4x4',
      'n4.tr.lead': 'The Trainer algorithms are written for a 3x3, where a lowercase r or f also turns the middle layer and M is the middle slice. On a 4x4 the middle is made of two inner slices, so six of the sixteen algorithms (the ones with r, f or M) break the centers and unpair dedges if you do them as written. Replace the moves like this and they do exactly what they do on a 3x3:',
      'n4.tr.map.r': 'r becomes 3Rw (three layers, like R).',
      'n4.tr.map.f': 'f becomes 3Fw (three layers, like F).',
      'n4.tr.map.M': "M becomes 2L 2R'; M' becomes 2L' 2R; M2 becomes 2L2 2R2 (both inner slices turn like L).",
      'n4.tr.same': 'The other {n} algorithms of the Trainer only use R, U, F and D face turns and work as they are on a 4x4.',
      'n4.tr.trainer': 'Trainer (3x3):',
      'n4.tr.four': 'On a 4x4:',
      'n4.label.recognize': 'How to recognize it',
      'n4.label.alg': 'Algorithm',
      'n4.label.steps': 'Steps',
      'n4.label.shortcut': 'Shortcut',
      'n4.alg.note.oll': 'In this algorithm 2R and 2L are only the inner slice (see the cards above). Do not replace them with r or Rw: the same sequence with two-layer moves also disturbs the corners.',
      'n4.alg.note.pll': 'In this algorithm 2R is only the inner slice and Uw is the two top layers (see the cards above). Do not replace 2R with r or Rw: the two-layer version breaks the middle layers.',
      'n4.cap.oll': 'The case seen from above. Gray stickers are not yellow. The bottom edge of the diagram is the side facing you.',
      'n4.cap.pll': 'The case seen from above. The bottom edge of the diagram is the side facing you.',
      'n4.alt.case': 'Top view of the last layer of this case.',
      'n4.alt.step': 'Top view of the last layer after step {n}.',
      'n4.tag.oll': 'OLL', 'n4.tag.pll': 'PLL',

      'n4.c.oll-parity.title': 'OLL parity: one flipped dedge',
      'n4.c.oll-parity.rec': 'In step 1 of the Trainer (yellow cross), with the edges already paired, count the dedges that show yellow on top. On a 3x3 it is always 0, 2 or 4. If you see an odd number (1 or 3), it is OLL parity. Hold any dedge that shows yellow on its side at the front: with 3 yellow dedges on top there is one such dedge, with only 1 there are three and any of them works.',
      'n4.c.oll-parity.note': 'The algorithm flips the dedge at the front and leaves every other piece where it was. With 3 yellow dedges on top, the yellow cross is now complete. With only 1, two dedges still show yellow on the side: that is a normal line or L, so do step 1 of the Trainer as usual before step 2 (the L shape and the dot need their 4x4 version, listed below).',
      'n4.c.oll-parity.alg4': '4x4 versions of the step 1 algorithms that use f:',
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
      'n4.step.hold.frontEdgeFlipped': 'Hold the cube so that one flipped dedge (yellow on its side) is at the front.',
      'n4.step.hold.swappedEdgesFrontBack': 'Turn the whole cube sideways (y) until the two swapped dedges are at the front and at the back. Either of the two ways works.',
      'n4.step.hold.swappedEdgesFrontRight': 'Turn the whole cube sideways (y) until the two swapped dedges are at the front and on the right.',
      'n4.step.hold.headlightsFrontOrBack': 'Turn the whole cube sideways (y) until the headlights (two corners of the same color on one side) are at the front or at the back. They must not be on the left or right side.',
      'n4.step.hold.headlightsLeft': 'Turn the whole cube sideways (y) until the headlights are on the left face.',
      'n4.step.hold.solvedEdgeBack': 'Hold the cube with the solved edge at the back.',
      'n4.step.alg.oll': 'Do the OLL parity algorithm. It only flips this dedge.',
      'n4.step.alg.pll': 'Do the PLL parity algorithm. Right after it the corners look turned half a turn and the left and right dedges look swapped as well: that is expected. Together with the half turn that follows, it swaps the front and back dedges, which puts them in place.',
      'n4.step.alg.pll.adj': 'Do the PLL parity algorithm. Right after it the corners look turned half a turn and the dedges look more mixed up than before: that is expected. After the half turn that follows, the corners are solved and three dedges are out of place.',
      'n4.step.alg.pll.short': 'Do the PLL parity algorithm. Right after it the corners look turned half a turn and the left and right dedges look swapped: that is expected. The T-perm in the next step fixes the corners and swaps those two dedges back.',
      'n4.step.alg.pll.any': 'Do the PLL parity algorithm once. Right after it the corners look turned half a turn: the half turn that follows puts them back.',
      'n4.step.alg.u2': 'Turn the top layer by half a turn.',
      'n4.step.auf': 'Turn the top layer to line it up (AUF). Here it is:',
      'n4.step.auf.none': 'The top layer is already lined up: no turn needed.',
      'n4.step.then.pll-opposite': 'The corners are now solved and two opposite dedges are swapped. That is the case "PLL parity: two opposite dedges swapped": continue with its steps.',
      'n4.step.3x3.OCLL': 'If the yellow cross is complete, continue with step 2 of the Trainer ({setName}), as usual: {names}. The ones that use r need their 4x4 version, listed below; the others work as they are. If two edges are still flipped (a line or an L), do step 1 first.',
      'n4.step.3x3.OCLL.alg4': '4x4 versions:',
      'n4.step.3x3.EPany': 'This is now a normal step 4 of the Trainer ({setName}): the corners are solved and the dedges are in one of its cases. In this example it is the {name}; yours can also be a Ua, Ub, H or Z (H and Z need their 4x4 version, see the card "Trainer algorithms on a 4x4").',
      'n4.step.3x3.CP': 'Do the normal corner step of the Trainer ({setName}): {name}.',
      'n4.step.3x3.EP': 'Three dedges are now out of place. Do step 4 of the Trainer ({setName}) with the {name}. The Ua does not solve this case.',
      'n4.shortcut.text': 'Same result without the separate corner step. Use it only with the headlights at the front or at the back: with the headlights on the left or right side the parity algorithm leaves an F-perm, which the T-perm does not solve.',
      'n4.next.oll': 'Next: step 2 of the Trainer (orient corners), then steps 3 and 4 as usual. PLL parity can still show up in step 3 or 4.',
      'n4.next.pll': 'Done: the last layer, and with it the whole cube, is solved.',
    },
    es: {
      'n4.title': 'Resolver un 4x4: notación y paridades',
      'n4.lead': 'En un 4x4 se resuelve por reducción: primero los centros, luego se emparejan las aristas y después se juega como un 3x3 (4LLL para la última capa). Ojo: seis de los algoritmos del Entrenador (los que llevan r, f o M) hay que reescribirlos para un 4x4, y en la última capa pueden aparecer dos casos que en un 3x3 son imposibles: la paridad de OLL y la paridad de PLL. Aquí tienes la notación que necesitas, la versión de 4x4 de cada algoritmo y una receta comprobada para cada caso.',
      'n4.flow.title': 'Dónde encajan las paridades',
      'n4.flow.1': 'Resuelve los centros y empareja las aristas (reducción). Una arista emparejada, formada por dos piezas de arista, se llama «arista doble» en esta página.',
      'n4.flow.2': 'Resuélvelo como un 3x3. Para la última capa usa los cuatro pasos del Entrenador: cruz amarilla, orientar esquinas, permutar esquinas y permutar aristas. Seis de los dieciséis algoritmos del Entrenador llevan r, f o M y no funcionan tal cual en un 4x4: usa su versión de 4x4 (tarjeta «Algoritmos del Entrenador en un 4x4», más abajo).',
      'n4.flow.3': 'Si en alguno de esos pasos ves algo que en un 3x3 no puede pasar, es una paridad. Las tarjetas de abajo te dicen cuál es y cómo arreglarla.',
      'n4.hold.title': 'Cómo sostener el cubo',
      'n4.hold.text': 'Para la última capa sostén el cubo como en el Entrenador: centro amarillo arriba y centro verde mirando hacia ti (el naranja queda a tu derecha). Los diagramas de la última capa se ven desde arriba: el borde de abajo del diagrama es el lado que te mira. Cada receta dice cuándo girar el cubo entero hacia un lado (rotación «y») antes de un algoritmo.',
      'n4.hold.cap': '4x4 resuelto: amarillo arriba, verde al frente, naranja a la derecha.',
      'n4.hold.alt': '4x4 resuelto visto de frente: amarillo arriba (U), verde al frente (F), naranja a la derecha (R).',

      'n4.not.title': 'Notación en un 4x4',
      'n4.not.lead': 'Un 4x4 tiene dos capas entre cada par de caras opuestas, así que hay más tipos de movimiento que en un 3x3. Cada tarjeta muestra el cubo antes del movimiento (las capas que giran están resaltadas y las flechas indican adónde van sus piezas) y después de hacerlo una vez. Los diagramas muestran el cubo con amarillo arriba y verde al frente.',
      'n4.mod': "Los modificadores son los mismos que en el 3x3: el apóstrofo (X') es el sentido contrario y un 2 después del movimiento (X2) es media vuelta.",
      'n4.warn.title': 'Cuidado con la r minúscula',
      'n4.warn.text': 'Muchos tutoriales de 4x4 escriben r, r2 o l para la capa interior sola. En esta app (pestaña Notación, 3x3) una r minúscula significa Rw: la cara exterior y la capa interior juntas. Por eso en esta sección la capa interior se escribe siempre 2R (o 2L) y los movimientos anchos siempre Rw (o Lw, Uw): nunca r. Si sigues un tutorial que usa r, comprueba si habla de una capa o de dos antes de copiarlo.',
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
      'n4.par.which.oll-parity': 'Paso de la cruz amarilla: 1 o 3 aristas dobles amarillas arriba.',
      'n4.par.which.pll-opposite': 'Esquinas colocadas, dos aristas dobles opuestas intercambiadas y las otras dos bien.',
      'n4.par.which.pll-adjacent': 'Esquinas colocadas, dos aristas dobles vecinas intercambiadas y las otras dos bien.',
      'n4.par.which.pll-corners': 'Todas las aristas bien, dos esquinas vecinas intercambiadas.',
      'n4.par.which.pll-cycle': 'Esquinas colocadas, aristas dobles mal colocadas de una forma que no es una Ua, Ub, H o Z ni un solo intercambio (por ejemplo las cuatro en un ciclo).',
      'n4.par.limit': 'Si, con las esquinas colocadas, tus aristas dobles coinciden con una Ua, Ub, H o Z, resuélvelas como dice el Entrenador (con las versiones de 4x4 de la H y la Z). Cualquier otra disposición impar la cubre la última tarjeta. Un intercambio en diagonal de dos esquinas con todas las aristas resueltas no está cubierto aquí.',

      'n4.tr.title': 'Algoritmos del Entrenador en un 4x4',
      'n4.tr.lead': 'Los algoritmos del Entrenador están escritos para un 3x3, donde una r o f minúscula también gira la capa del medio y M es el corte del medio. En un 4x4 el medio son dos capas interiores, así que seis de los dieciséis algoritmos (los que llevan r, f o M) rompen los centros y desemparejan aristas dobles si los haces tal como están escritos. Cambia los movimientos así y hacen exactamente lo mismo que en un 3x3:',
      'n4.tr.map.r': 'r pasa a ser 3Rw (tres capas, como R).',
      'n4.tr.map.f': 'f pasa a ser 3Fw (tres capas, como F).',
      'n4.tr.map.M': "M pasa a ser 2L 2R'; M' pasa a ser 2L' 2R; M2 pasa a ser 2L2 2R2 (las dos capas interiores giran como L).",
      'n4.tr.same': 'Los otros {n} algoritmos del Entrenador solo usan giros de cara R, U, F y D y funcionan tal cual en un 4x4.',
      'n4.tr.trainer': 'Entrenador (3x3):',
      'n4.tr.four': 'En un 4x4:',
      'n4.label.recognize': 'Cómo reconocerlo',
      'n4.label.alg': 'Algoritmo',
      'n4.label.steps': 'Pasos',
      'n4.label.shortcut': 'Atajo',
      'n4.alg.note.oll': 'En este algoritmo 2R y 2L son solo la capa interior (mira las tarjetas de arriba). No los cambies por r ni por Rw: la misma secuencia con movimientos de dos capas también desordena las esquinas.',
      'n4.alg.note.pll': 'En este algoritmo 2R es solo la capa interior y Uw son las dos capas de arriba (mira las tarjetas de arriba). No cambies 2R por r ni por Rw: la versión de dos capas rompe las capas del medio.',
      'n4.cap.oll': 'El caso visto desde arriba. Las piezas grises no son amarillas. El borde de abajo del diagrama es el lado que te mira.',
      'n4.cap.pll': 'El caso visto desde arriba. El borde de abajo del diagrama es el lado que te mira.',
      'n4.alt.case': 'Vista desde arriba de la última capa de este caso.',
      'n4.alt.step': 'Vista desde arriba de la última capa después del paso {n}.',
      'n4.tag.oll': 'OLL', 'n4.tag.pll': 'PLL',

      'n4.c.oll-parity.title': 'Paridad de OLL: una arista doble volteada',
      'n4.c.oll-parity.rec': 'En el paso 1 del Entrenador (cruz amarilla), con las aristas ya emparejadas, cuenta las aristas dobles que muestran amarillo arriba. En un 3x3 son siempre 0, 2 o 4. Si ves un número impar (1 o 3), es paridad de OLL. Pon delante cualquier arista doble que muestre amarillo de lado: con 3 aristas dobles amarillas arriba hay una así; con solo 1 hay tres y sirve cualquiera.',
      'n4.c.oll-parity.note': 'El algoritmo voltea la arista doble de delante y deja todas las demás piezas donde estaban. Con 3 aristas dobles amarillas arriba, la cruz amarilla queda completa. Con solo 1, dos aristas dobles siguen mostrando amarillo de lado: es una línea o una L normal, así que haz el paso 1 del Entrenador como siempre antes del paso 2 (la forma de L y el punto necesitan su versión de 4x4, en la lista de abajo).',
      'n4.c.oll-parity.alg4': 'Versiones de 4x4 de los algoritmos del paso 1 que llevan f:',
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
      'n4.step.hold.frontEdgeFlipped': 'Sostén el cubo con una arista doble volteada (amarillo de lado) delante.',
      'n4.step.hold.swappedEdgesFrontBack': 'Gira el cubo entero hacia un lado (rotación «y») hasta que las dos aristas dobles intercambiadas queden delante y atrás. Sirve cualquiera de las dos formas.',
      'n4.step.hold.swappedEdgesFrontRight': 'Gira el cubo entero hacia un lado (rotación «y») hasta que las dos aristas dobles intercambiadas queden delante y a la derecha.',
      'n4.step.hold.headlightsFrontOrBack': 'Gira el cubo entero hacia un lado (rotación «y») hasta que los faros (dos esquinas del mismo color en un lado) queden delante o atrás. No deben quedar a la izquierda ni a la derecha.',
      'n4.step.hold.headlightsLeft': 'Gira el cubo entero hacia un lado (rotación «y») hasta que los faros queden en la cara izquierda.',
      'n4.step.hold.solvedEdgeBack': 'Sostén el cubo con la arista resuelta atrás.',
      'n4.step.alg.oll': 'Haz el algoritmo de paridad de OLL. Solo voltea esta arista doble.',
      'n4.step.alg.pll': 'Haz el algoritmo de paridad de PLL. Justo después las esquinas parecen giradas media vuelta y las aristas dobles de la izquierda y la derecha parecen intercambiadas también: es lo esperado. Junto con la media vuelta que viene a continuación, intercambia las aristas dobles de delante y de atrás, y las deja en su sitio.',
      'n4.step.alg.pll.adj': 'Haz el algoritmo de paridad de PLL. Justo después las esquinas parecen giradas media vuelta y las aristas dobles parecen más desordenadas que antes: es lo esperado. Tras la media vuelta que viene a continuación, las esquinas quedan resueltas y tres aristas dobles fuera de sitio.',
      'n4.step.alg.pll.short': 'Haz el algoritmo de paridad de PLL. Justo después las esquinas parecen giradas media vuelta y las aristas dobles de la izquierda y la derecha parecen intercambiadas: es lo esperado. La T-perm del paso siguiente arregla las esquinas y devuelve esas dos aristas dobles a su sitio.',
      'n4.step.alg.pll.any': 'Haz el algoritmo de paridad de PLL una vez. Justo después las esquinas parecen giradas media vuelta: la media vuelta que viene a continuación las devuelve a su sitio.',
      'n4.step.alg.u2': 'Gira la capa de arriba media vuelta.',
      'n4.step.auf': 'Gira la capa de arriba para alinearla (AUF). Aquí es:',
      'n4.step.auf.none': 'La capa de arriba ya está alineada: no hace falta girar.',
      'n4.step.then.pll-opposite': 'Ahora las esquinas están resueltas y hay dos aristas dobles opuestas intercambiadas. Es el caso «Paridad de PLL: dos aristas dobles opuestas intercambiadas»: sigue sus pasos.',
      'n4.step.3x3.OCLL': 'Si la cruz amarilla está completa, sigue con el paso 2 del Entrenador ({setName}), como siempre: {names}. Los que llevan r necesitan su versión de 4x4, en la lista de abajo; los demás funcionan tal cual. Si aún quedan dos aristas volteadas (una línea o una L), haz primero el paso 1.',
      'n4.step.3x3.OCLL.alg4': 'Versiones de 4x4:',
      'n4.step.3x3.EPany': 'Ahora es un paso 4 normal del Entrenador ({setName}): las esquinas están resueltas y las aristas dobles están en uno de sus casos. En este ejemplo es la {name}; la tuya también puede ser una Ua, Ub, H o Z (la H y la Z necesitan su versión de 4x4, mira la tarjeta «Algoritmos del Entrenador en un 4x4»).',
      'n4.step.3x3.CP': 'Haz el paso normal de esquinas del Entrenador ({setName}): {name}.',
      'n4.step.3x3.EP': 'Ahora hay tres aristas dobles fuera de sitio. Haz el paso 4 del Entrenador ({setName}) con la {name}. La Ua no resuelve este caso.',
      'n4.shortcut.text': 'El mismo resultado sin el paso de esquinas por separado. Úsalo solo con los faros delante o atrás: con los faros a la izquierda o a la derecha, el algoritmo de paridad deja una F-perm, que la T-perm no resuelve.',
      'n4.next.oll': 'Después: paso 2 del Entrenador (orientar esquinas) y luego los pasos 3 y 4 como siempre. La paridad de PLL todavía puede aparecer en el paso 3 o 4.',
      'n4.next.pll': 'Listo: la última capa, y con ella todo el cubo, queda resuelta.',
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
        out.push({ kind: 'alg', alg: s.alg, key: ALG_KEY[s.alg], state: state });
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
    if (!Cube4.isSolved(end)) { // the recipe ends with an AUF that its data leaves implicit (the T-perm of the shortcut)
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

  function stepHtml(it, n, mask, lang, ctx) {
    var T = function (k, p) { return t(k, p, lang); };
    var body = '', setName;
    if (it.kind === 'hold') {
      body = '<p>' + esc(T('n4.step.hold.' + it.when)) + '</p>';
    } else if (it.kind === 'alg') {
      body = '<p>' + esc(T(it.key === 'pll' ? pllKey(ctx) : 'n4.step.alg.' + it.key)) + '</p>' + algHtml(it.alg);
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
    h += '<div class="n4-algbox"><span class="n4-label">' + esc(T('n4.label.alg')) + '</span>' +
      '<code class="n4-big" data-alg="' + esc(parity.alg) + '">' + esc(parity.alg) + '</code>' +
      '<p class="n4-algnote">' + esc(T('n4.alg.note.' + c.step)) + '</p></div>';
    if (c.id === 'oll-parity') {
      h += '<div class="nt-callout n4-note" role="note"><p>' + esc(T('n4.c.oll-parity.note')) + '</p><p class="n4-sub">' +
        esc(T('n4.c.oll-parity.alg4')) + '</p>' + alg4List(['eo-l', 'eo-dot'], lang) + '</div>';
    }
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

      h += trainerCard(lang);

      h += '<h3 class="nt-sec">' + esc(T('n4.par.title')) + '</h3><p class="nt-lead">' + esc(T('n4.par.lead')) + '</p>';
      h += '<section class="card n4-which"><h4>' + esc(T('n4.par.which.title')) + '</h4><ul class="n4-list">' +
        P.CASES.map(function (c) {
          return '<li><b>' + esc(T('n4.c.' + c.id + '.title')) + '.</b> ' + esc(T('n4.par.which.' + c.id)) + '</li>';
        }).join('') + '</ul><p class="nt-note">' + esc(T('n4.par.limit')) + '</p></section>';
      P.CASES.forEach(function (c) { h += caseCard(c, lang); });
      return h;
    });
  }

  var Notation4View = {
    STRINGS: STRINGS,
    NOTATION: P.NOTATION,
    CASES: P.CASES,
    afterState: afterState,
    stepsFor: stepsFor,
    build: build,
  };

  if (isNode) module.exports = Notation4View;
  else root.Notation4View = Notation4View;
})(typeof window !== 'undefined' ? window : globalThis);
