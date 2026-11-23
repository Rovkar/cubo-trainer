// 4x4 training plan (data), in English (default) and Spanish. The app renders it in the "Plan" tab when the 4x4 mode is on.
// Plan de entrenamiento de 4x4 (datos), en inglés (por defecto) y español. La app lo muestra en la pestaña "Plan" con el modo 4x4.
// Same structure as js/plan.js (intro, phases[{id,title,weeks,goal,goalMs,summary,sections,milestones}], routine, tips).
// Texts allow simple HTML (<b>, <i>, <code>). Both languages share the same structure (ids, goalMs, counts).
// Ids use the prefix 'p4-' so the progress of the 3x3 plan (f0..f4) is never touched. goalMs is null everywhere:
// the user's 4x4 times are not known, so the goals are skills. Every algorithm shown comes from js/parity4.js
// (checked in tests/plan4.test.js); an inner slice is always written 2R / 2L, never the ambiguous lowercase r.
(function (root) {
  'use strict';
  var PLANS4 = {
    en: {
      intro:
        "Starting point: you already solve the 3x3 with the four-look last layer (4LLL). A 4x4 is solved by reduction: " +
        "centers first, then you pair up the edges, and after that it plays like a 3x3, with two extra last-layer cases (parity). " +
        "The plan is short and moves in phases; don't move on until you can do what the current phase asks. " +
        "Your 4x4 times are not known yet, so the goals here are skills, not times.",

      phases: [
        {
          id: "p4-0",
          title: "Phase 0 · Diagnosis",
          weeks: "Days 1–3",
          goal: "Find out your starting point",
          goalMs: null,
          summary:
            "Before changing anything, measure. A 4x4 solve has three very different stages, and you want to know which one eats most of your time.",
          sections: [
            {
              heading: "What to do",
              items: [
                "Switch the app to <b>4x4</b> (header, next to the title) and turn on <b>Phase mode</b> with the reduction preset (Centers · Edges · 3x3 stage). Do 5 to 12 solves. A 4x4 solve takes several minutes at first: that is normal.",
                "Check in Stats which stage takes the biggest share of your time. Many beginners lose it in the edges; whatever you find tells you where to put the work.",
                "Check your cube: a 4x4 that pops or locks up makes every stage harder. A well-lubricated or magnetic one turns much more smoothly.",
                "Open the <b>Notation</b> tab once (with 4x4 on): you will see <code>2R</code>, <code>Rw</code> and <code>3Rw</code>, which do not exist on a 3x3.",
              ],
            },
          ],
          milestones: [
            { id: "p4-0-m1", text: "I did several 4x4 solves in Phase mode and have my baseline" },
            { id: "p4-0-m2", text: "I know which stage is my slowest" },
            { id: "p4-0-m3", text: "I read the 4x4 notation page (inner slice, wide moves)" },
          ],
        },
        {
          id: "p4-1",
          title: "Phase 1 · Centers",
          weeks: "Weeks 1–3",
          goal: "Solve the six centers without wasting moves",
          goalMs: null,
          summary:
            "The first stage. On a 4x4 the centers are loose pieces with no fixed color: you decide the color scheme, and once you have built a center you must not undo it.",
          sections: [
            {
              heading: "The idea",
              items: [
                "<b>The corners decide the colors.</b> Look at one corner: its three colors tell you which centers must be neighbors. On a standard cube white is opposite yellow, green opposite blue and red opposite orange; with white on top and green in front, red is on your right.",
                "<b>An outer face turn never moves a center to another face.</b> <code>U</code>, <code>R</code>, <code>F</code>… only spin their own four centers. Inner slices (<code>2R</code>) and wide moves (<code>Rw</code>) are the ones that carry centers around.",
                "<b>Two opposite centers first</b> (for example white and yellow), each one as a block of four pieces, then the other four. Keep the finished ones on top and bottom while you build the rest: turns around that same vertical axis (<code>U</code>, <code>D</code>, <code>2U</code>, <code>2D</code>) never mix them up.",
                "To bring a piece from another face into place you will need a few <i>center commutators</i> (a slice move, a turn and the undo). Learn them from any 4x4 tutorial and write the inner slice always as <code>2R</code>, never as <code>r</code> (see the warning in the 4x4 Notation tab).",
              ],
            },
            {
              heading: "How to practice",
              items: [
                "Solve only the centers on a scrambled cube and stop. Repeat it many times; the goal is to never have to rebuild a finished center.",
                "Before you start the next stage, check the centers against a corner: a wrong color scheme cannot be fixed at the end.",
              ],
            },
          ],
          milestones: [
            { id: "p4-1-m1", text: "I use a corner to decide which colors go next to each other" },
            { id: "p4-1-m2", text: "I build the first two opposite centers without help" },
            { id: "p4-1-m3", text: "I finish the other four without breaking the finished ones" },
            { id: "p4-1-m4", text: "I solved all six centers correctly on three scrambles in a row" },
          ],
        },
        {
          id: "p4-2",
          title: "Phase 2 · Edge pairing",
          weeks: "Weeks 3–6",
          goal: "Pair all 12 edges without breaking the centers",
          goalMs: null,
          summary:
            "Each edge of a 4x4 is made of two wing pieces that must be joined into a pair (a dedge). When all 12 are paired, the cube behaves like a 3x3.",
          sections: [
            {
              heading: "The idea",
              items: [
                "<b>Match by color:</b> two wings belong together when they have the same two colors (for example white-red), wherever they are on the cube.",
                "<b>Pair the first edges in sets, not one by one:</b> look for several wings you can join in one go. The first 8 are the easy ones; the last 4 need care because almost any move can break a pair you already made.",
                "<b>Protect finished pairs:</b> a slice move only touches the four edges around that slice. Hold the cube so the slice you turn does not pass through a finished pair, and put it back after you join two wings so the centers stay solved.",
                "<b>The last two edges</b> often cannot be paired with plain slice moves. That case has its own algorithm (the 'flip' or last-two-edges algorithm, not included in this app): learn it from a 4x4 tutorial and try it on the cube before you rely on it.",
                "<b>This is not parity.</b> Parity only shows up in the last layer, after the reduction (Phase 3).",
              ],
            },
            {
              heading: "How to practice",
              items: [
                "Week 3: with the centers solved, pair only four edges, very slowly. Check the centers after every pair.",
                "Week 4: all 12 edges, with no timer.",
                "Weeks 5–6: go back to the timer in Phase mode. The Edges stage should stop being the biggest slice of your solve.",
              ],
            },
          ],
          milestones: [
            { id: "p4-2-m1", text: "I find the partner of a wing by color and join them" },
            { id: "p4-2-m2", text: "I pair 8 edges without breaking the centers" },
            { id: "p4-2-m3", text: "I pair the last 4 without breaking the pairs I already made" },
            { id: "p4-2-m4", text: "I solve the last two edges" },
            { id: "p4-2-m5", text: "I reach the 3x3 stage in several solves in a row" },
          ],
        },
        {
          id: "p4-3",
          title: "Phase 3 · Last layer and parity",
          weeks: "Weeks 6–9",
          goal: "Finish any solve, parity included",
          goalMs: null,
          summary:
            "After the reduction the cube plays like a 3x3: your cross, F2L and 4LLL carry over. Two things change: six of the sixteen Trainer algorithms have to be rewritten for a 4x4, and two last-layer cases appear that never happen on a 3x3.",
          sections: [
            {
              heading: "What changes",
              items: [
                "<b>Rewrite rule:</b> <code>r</code> becomes <code>3Rw</code>, <code>f</code> becomes <code>3Fw</code> and <code>M</code> becomes <code>2L 2R'</code>. The six that change are the T and L of orient corners, the L shape and the dot of the yellow cross, and the H and Z of permute edges. The Trainer in 4x4 mode and the 4x4 Notation tab show all six already rewritten.",
                "<b>OLL parity</b>: in the yellow cross step you see 1 or 3 yellow dedges on top (an odd number). Hold a dedge that shows yellow on its side at the front and do <code>2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2</code>. It only flips that dedge.",
                "<b>PLL parity</b>: with the corners placed, the dedges are in a position no 3x3 case has (for example two swapped). Do <code>2R2 U2 2R2 Uw2 2R2 Uw2</code> followed by a half turn <code>U2</code>: that is how most recipes start. The 4x4 Notation tab has the exact recipe for each case, with a diagram after every step.",
                "<b>Parity is normal.</b> Each kind shows up in about half of the solves. It does not mean you made a mistake.",
              ],
            },
            {
              heading: "How to practice",
              items: [
                "Practice the six rewritten algorithms, OLL parity and the opposite-dedges PLL parity in the Trainer (4x4 mode), and the other PLL parity cases with the recipes of the 4x4 Notation tab, until you run them without looking at the page.",
                "Practice recognizing: before doing anything, say which case you have (odd number of flipped dedges, two swapped dedges, two swapped corners…) and only then do the algorithm.",
                "Do full solves and note in each one whether parity showed up and whether you fixed it right the first time.",
              ],
            },
          ],
          milestones: [
            { id: "p4-3-m1", text: "I know the 4x4 versions of the six algorithms that change" },
            { id: "p4-3-m2", text: "I recognize OLL parity (an odd number of flipped dedges) and fix it" },
            { id: "p4-3-m3", text: "I recognize the PLL parity cases and fix them" },
            { id: "p4-3-m4", text: "I finished three complete solves in a row, parity included" },
          ],
        },
        {
          id: "p4-4",
          title: "Phase 4 · Lookahead and turning",
          weeks: "Months 2–4",
          goal: "Keep turning without pauses between stages",
          goalMs: null,
          summary:
            "Once you finish solves reliably, the improvement comes from continuous turning: less thinking time between stages and eyes always one step ahead.",
          sections: [
            {
              heading: "Priorities",
              items: [
                "<b>Look ahead inside each stage:</b> while you place one piece, look for the next. Slow solves without pauses are still the best exercise.",
                "<b>No dead time between stages:</b> start looking for the next stage's first piece while you finish the previous one.",
                "<b>Fewer whole-cube rotations</b> (<code>x</code>, <code>y</code>, <code>z</code>): pick centers and pairing moves that let you keep the same hold.",
                "<b>The 3x3 stage is a 3x3 solve:</b> everything you train for the 3x3 (finger tricks, F2L, full PLL) pays off here too.",
                "Turn on the detailed preset of Phase mode (Centers · Edges · Cross · F2L · Last layer) and work on the biggest slice in Stats.",
              ],
            },
          ],
          milestones: [
            { id: "p4-4-m1", text: "I keep turning between stages without stopping to think" },
            { id: "p4-4-m2", text: "I use the detailed Phase mode and know my slowest stage" },
            { id: "p4-4-m3", text: "I solve with very few whole-cube rotations" },
            { id: "p4-4-m4", text: "I look ahead to the next pair while inserting the previous one" },
          ],
        },
      ],

      routine: {
        title: "Daily routine (30–45 min)",
        blocks: [
          { minutes: "5", title: "Warm-up", text: "Slow, clean turning and the algorithms you already know (4LLL, parity)." },
          { minutes: "15", title: "Technical block", text: "The focus of your current phase: centers only, edge pairing, parity recipes…" },
          { minutes: "15–20", title: "Timed block", text: "2–3 full solves with Phase mode on (a 4x4 solve is long, so a few are enough)." },
          { minutes: "2", title: "Review", text: "Check in Stats which stage was the slowest: that is tomorrow's focus." },
        ],
      },

      tips: [
        "Consistency over duration: 30 minutes every day beats 3 hours on Sunday.",
        "Parity is normal on a 4x4. Each kind appears in about half of the solves.",
        "Check your centers against a corner before pairing edges: a wrong color scheme cannot be fixed at the end.",
        "Turning slowly without pauses is faster than turning fast and stopping to look for pieces.",
        "When you copy an algorithm from a tutorial, check what its lowercase <code>r</code> means: here <code>r</code> is two layers and the inner slice is <code>2R</code>.",
      ],
    },

    es: {
      intro:
        "Punto de partida: ya resuelves el 3x3 con la última capa en 4 pasos (4LLL). Un 4x4 se resuelve por reducción: " +
        "primero los centros, luego se emparejan las aristas y después se juega como un 3x3, con dos casos extra en la última capa (paridades). " +
        "El plan es corto y avanza en fases; no pases a la siguiente hasta que puedas hacer lo que pide la actual. " +
        "Aún no se conocen tus tiempos en 4x4, así que las metas son habilidades, no tiempos.",

      phases: [
        {
          id: "p4-0",
          title: "Fase 0 · Diagnóstico",
          weeks: "Días 1–3",
          goal: "Conocer tu punto de partida",
          goalMs: null,
          summary:
            "Antes de cambiar nada, mide. Una resolución de 4x4 tiene tres etapas muy distintas y te interesa saber cuál se come más tiempo.",
          sections: [
            {
              heading: "Qué hacer",
              items: [
                "Cambia la app a <b>4x4</b> (cabecera, junto al título) y activa el <b>modo Fases</b> con el preset de reducción (Centros · Aristas · Etapa 3x3). Haz entre 5 y 12 resoluciones. Al principio un 4x4 tarda varios minutos: es normal.",
                "Revisa en Estadísticas qué etapa ocupa más porcentaje del tiempo. Muchos principiantes lo pierden en las aristas; lo que encuentres te dice dónde poner el trabajo.",
                "Revisa tu cubo: un 4x4 que se desarma o se bloquea dificulta todas las etapas. Uno bien lubricado o magnético gira mucho más suave.",
                "Abre una vez la pestaña <b>Notación</b> (con 4x4 activado): verás <code>2R</code>, <code>Rw</code> y <code>3Rw</code>, que no existen en un 3x3.",
              ],
            },
          ],
          milestones: [
            { id: "p4-0-m1", text: "Hice varias resoluciones de 4x4 con modo Fases y tengo mi punto de partida" },
            { id: "p4-0-m2", text: "Sé cuál es mi etapa más lenta" },
            { id: "p4-0-m3", text: "Leí la página de notación del 4x4 (capa interior, movimientos anchos)" },
          ],
        },
        {
          id: "p4-1",
          title: "Fase 1 · Centros",
          weeks: "Semanas 1–3",
          goal: "Resolver los seis centros sin perder movimientos",
          goalMs: null,
          summary:
            "La primera etapa. En un 4x4 los centros son piezas sueltas sin color fijo: tú decides el esquema de colores y, una vez construido un centro, no debes deshacerlo.",
          sections: [
            {
              heading: "La idea",
              items: [
                "<b>Las esquinas deciden los colores.</b> Mira una esquina: sus tres colores te dicen qué centros deben ser vecinos. En un cubo estándar el blanco está opuesto al amarillo, el verde al azul y el rojo al naranja; con el blanco arriba y el verde al frente, el rojo queda a tu derecha.",
                "<b>Un giro de cara exterior nunca lleva un centro a otra cara.</b> <code>U</code>, <code>R</code>, <code>F</code>… solo giran sus propios cuatro centros. Las capas interiores (<code>2R</code>) y los movimientos anchos (<code>Rw</code>) son los que mueven centros de una cara a otra.",
                "<b>Primero dos centros opuestos</b> (por ejemplo blanco y amarillo), cada uno como un bloque de cuatro piezas, y luego los otros cuatro. Deja los terminados arriba y abajo mientras construyes el resto: los giros alrededor de ese mismo eje vertical (<code>U</code>, <code>D</code>, <code>2U</code>, <code>2D</code>) nunca los mezclan.",
                "Para traer una pieza de otra cara a su sitio necesitarás unos pocos <i>conmutadores de centros</i> (un movimiento de capa, un giro y el deshacer). Apréndelos de cualquier tutorial de 4x4 y escribe siempre la capa interior como <code>2R</code>, nunca como <code>r</code> (mira el aviso de la pestaña Notación en 4x4).",
              ],
            },
            {
              heading: "Cómo practicarlo",
              items: [
                "Resuelve solo los centros de una mezcla y para. Repítelo muchas veces; la meta es no tener que rehacer nunca un centro ya terminado.",
                "Antes de pasar a la siguiente etapa, comprueba los centros con una esquina: un esquema de colores equivocado no se arregla al final.",
              ],
            },
          ],
          milestones: [
            { id: "p4-1-m1", text: "Uso una esquina para decidir qué colores van juntos" },
            { id: "p4-1-m2", text: "Construyo los dos primeros centros opuestos sin ayuda" },
            { id: "p4-1-m3", text: "Termino los otros cuatro sin romper los ya terminados" },
            { id: "p4-1-m4", text: "Resolví los seis centros correctamente en tres mezclas seguidas" },
          ],
        },
        {
          id: "p4-2",
          title: "Fase 2 · Emparejar aristas",
          weeks: "Semanas 3–6",
          goal: "Emparejar las 12 aristas sin romper los centros",
          goalMs: null,
          summary:
            "Cada arista de un 4x4 está formada por dos piezas que hay que unir en un par (una arista doble). Con las 12 emparejadas, el cubo se comporta como un 3x3.",
          sections: [
            {
              heading: "La idea",
              items: [
                "<b>Empareja por color:</b> dos piezas van juntas cuando tienen los mismos dos colores (por ejemplo blanco-rojo), estén donde estén en el cubo.",
                "<b>Empareja las primeras aristas por tandas, no una a una:</b> busca varias piezas que puedas unir de una vez. Las primeras 8 son las fáciles; las últimas 4 piden cuidado porque casi cualquier movimiento puede romper un par que ya hiciste.",
                "<b>Protege los pares terminados:</b> un movimiento de capa solo toca las cuatro aristas que rodean esa capa. Sostén el cubo de modo que la capa que giras no pase por un par terminado, y devuélvela a su sitio después de unir dos piezas para que los centros sigan resueltos.",
                "<b>Las dos últimas aristas</b> muchas veces no se pueden emparejar con simples movimientos de capa. Ese caso tiene su propio algoritmo (el «flip» o algoritmo de las dos últimas aristas, que esta app no incluye): apréndelo de un tutorial de 4x4 y pruébalo en el cubo antes de fiarte de él.",
                "<b>Esto no es paridad.</b> La paridad solo aparece en la última capa, después de la reducción (Fase 3).",
              ],
            },
            {
              heading: "Cómo practicarlo",
              items: [
                "Semana 3: con los centros resueltos, empareja solo cuatro aristas, muy despacio. Comprueba los centros después de cada par.",
                "Semana 4: las 12 aristas, sin cronómetro.",
                "Semanas 5–6: vuelve al cronómetro con modo Fases. La etapa Aristas debería dejar de ser la porción más grande de tu resolución.",
              ],
            },
          ],
          milestones: [
            { id: "p4-2-m1", text: "Encuentro la pareja de una pieza por color y las uno" },
            { id: "p4-2-m2", text: "Emparejo 8 aristas sin romper los centros" },
            { id: "p4-2-m3", text: "Emparejo las últimas 4 sin romper los pares que ya hice" },
            { id: "p4-2-m4", text: "Resuelvo las dos últimas aristas" },
            { id: "p4-2-m5", text: "Llego a la etapa 3x3 en varias resoluciones seguidas" },
          ],
        },
        {
          id: "p4-3",
          title: "Fase 3 · Última capa y paridades",
          weeks: "Semanas 6–9",
          goal: "Terminar cualquier resolución, paridades incluidas",
          goalMs: null,
          summary:
            "Después de la reducción el cubo se juega como un 3x3: tu cruz, F2L y 4LLL sirven igual. Cambian dos cosas: seis de los dieciséis algoritmos del Entrenador hay que reescribirlos para un 4x4, y aparecen dos casos de última capa que en un 3x3 no pasan nunca.",
          sections: [
            {
              heading: "Qué cambia",
              items: [
                "<b>Regla de reescritura:</b> <code>r</code> pasa a ser <code>3Rw</code>, <code>f</code> pasa a ser <code>3Fw</code> y <code>M</code> pasa a ser <code>2L 2R'</code>. Los seis que cambian son la T y la L de orientar esquinas, la forma de L y el punto de la cruz amarilla, y la H y la Z de permutar aristas. El Entrenador en modo 4x4 y la pestaña Notación en 4x4 muestran los seis ya reescritos.",
                "<b>Paridad de OLL</b>: en el paso de la cruz amarilla ves 1 o 3 aristas dobles amarillas arriba (un número impar). Pon delante una arista doble que muestre amarillo de lado y haz <code>2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2</code>. Solo voltea esa arista doble.",
                "<b>Paridad de PLL</b>: con las esquinas colocadas, las aristas dobles quedan en una posición que ningún caso del 3x3 tiene (por ejemplo, dos intercambiadas). Haz <code>2R2 U2 2R2 Uw2 2R2 Uw2</code> seguido de media vuelta <code>U2</code>: así empiezan la mayoría de recetas. La pestaña Notación en 4x4 tiene la receta exacta de cada caso, con un diagrama después de cada paso.",
                "<b>La paridad es normal.</b> Cada tipo aparece en aproximadamente la mitad de las resoluciones. No significa que hayas hecho algo mal.",
              ],
            },
            {
              heading: "Cómo practicarlo",
              items: [
                "Practica los seis algoritmos reescritos, la paridad de OLL y la paridad de PLL de aristas dobles opuestas en el Entrenador (modo 4x4), y los otros casos de paridad de PLL con las recetas de la pestaña Notación en 4x4, hasta ejecutarlos sin mirar la página.",
                "Practica el reconocimiento: antes de hacer nada, di qué caso tienes (número impar de aristas dobles volteadas, dos aristas dobles intercambiadas, dos esquinas intercambiadas…) y solo entonces haz el algoritmo.",
                "Haz resoluciones completas y anota en cada una si salió paridad y si la arreglaste bien a la primera.",
              ],
            },
          ],
          milestones: [
            { id: "p4-3-m1", text: "Sé las versiones de 4x4 de los seis algoritmos que cambian" },
            { id: "p4-3-m2", text: "Reconozco la paridad de OLL (un número impar de aristas dobles volteadas) y la arreglo" },
            { id: "p4-3-m3", text: "Reconozco los casos de paridad de PLL y los arreglo" },
            { id: "p4-3-m4", text: "Terminé tres resoluciones completas seguidas, paridades incluidas" },
          ],
        },
        {
          id: "p4-4",
          title: "Fase 4 · Lookahead y fluidez",
          weeks: "Meses 2–4",
          goal: "Seguir girando sin pausas entre etapas",
          goalMs: null,
          summary:
            "Cuando ya terminas las resoluciones con fiabilidad, la mejora viene de girar de forma continua: menos tiempo pensando entre etapas y los ojos siempre un paso por delante.",
          sections: [
            {
              heading: "Prioridades",
              items: [
                "<b>Lookahead dentro de cada etapa:</b> mientras colocas una pieza, ya buscas la siguiente. Las resoluciones lentas sin pausas siguen siendo el mejor ejercicio.",
                "<b>Sin tiempos muertos entre etapas:</b> empieza a buscar la primera pieza de la siguiente etapa mientras terminas la anterior.",
                "<b>Menos rotaciones del cubo entero</b> (<code>x</code>, <code>y</code>, <code>z</code>): elige centros y movimientos de emparejado que te dejen mantener el mismo agarre.",
                "<b>La etapa 3x3 es una resolución de 3x3:</b> todo lo que entrenes para el 3x3 (finger tricks, F2L, PLL completo) rinde también aquí.",
                "Activa el preset detallado del modo Fases (Centros · Aristas · Cruz · F2L · Última capa) y trabaja la porción más grande en Estadísticas.",
              ],
            },
          ],
          milestones: [
            { id: "p4-4-m1", text: "Sigo girando entre etapas sin detenerme a pensar" },
            { id: "p4-4-m2", text: "Uso el modo Fases detallado y sé cuál es mi etapa más lenta" },
            { id: "p4-4-m3", text: "Resuelvo con muy pocas rotaciones del cubo entero" },
            { id: "p4-4-m4", text: "Miro el siguiente par mientras inserto el anterior" },
          ],
        },
      ],

      routine: {
        title: "Rutina diaria (30–45 min)",
        blocks: [
          { minutes: "5", title: "Calentamiento", text: "Giros lentos y limpios y los algoritmos que ya conoces (4LLL, paridades)." },
          { minutes: "15", title: "Bloque técnico", text: "El foco de tu fase actual: solo centros, emparejar aristas, recetas de paridad…" },
          { minutes: "15–20", title: "Bloque cronometrado", text: "2–3 resoluciones completas con el modo Fases activado (un 4x4 es largo, con unas pocas basta)." },
          { minutes: "2", title: "Revisión", text: "Mira en Estadísticas qué etapa fue la más lenta: ese es el foco de mañana." },
        ],
      },

      tips: [
        "Constancia antes que duración: 30 minutos diarios rinden más que 3 horas el domingo.",
        "La paridad es normal en un 4x4. Cada tipo aparece en aproximadamente la mitad de las resoluciones.",
        "Comprueba tus centros con una esquina antes de emparejar aristas: un esquema de colores equivocado no se arregla al final.",
        "Girar despacio y sin pausas es más rápido que girar rápido y pararse a buscar piezas.",
        "Cuando copies un algoritmo de un tutorial, comprueba qué significa su <code>r</code> minúscula: aquí <code>r</code> son dos capas y la capa interior es <code>2R</code>.",
      ],
    },
  };

  root.TRAINING_PLANS4 = PLANS4;
  if (typeof module !== 'undefined' && module.exports) module.exports = PLANS4;
})(typeof window !== 'undefined' ? window : globalThis);
