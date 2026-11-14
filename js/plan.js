// Training-plan content (data), in English (default) and Spanish. The app renders it in the "Plan" tab.
// Contenido del plan de entrenamiento (datos), en inglés (por defecto) y español.
// Texts allow simple HTML (<b>, <i>, <code>). Both languages share the same structure (ids, goalMs, counts).
// goalMs: ao12 goal in milliseconds to consider the phase done (null = no time goal).
(function (root) {
  'use strict';
  var PLANS = {
    en: {
    intro:
      "Starting point: over 1 minute with the layer-by-layer method. The plan moves in phases; " +
      "don't move on to the next one until you reach the ao12 goal of the current one (or come close). " +
      "Phases 2 and 3 can overlap if you feel comfortable.",

    phases: [
      {
        id: "f0",
        title: "Phase 0 · Diagnosis",
        weeks: "Days 1–3",
        goal: "Find out your starting point",
        goalMs: null,
        summary:
          "Before changing anything, measure. That way you'll know which part of the solve costs you the most and you'll be able to check that you're improving.",
        sections: [
          {
            heading: "What to do",
            items: [
              "Turn on <b>Phase mode</b> with the <i>Beginner</i> preset (Cross · First layer · Second layer · Last layer) and do 12 solves.",
              "Note your <b>baseline ao12</b> and check in Stats which phase takes the biggest share of your time.",
              "Check your cube: if it isn't a magnetic speedcube, replacing it is the cheapest improvement there is. An entry-level one (MoYu, QiYi, YJ or GAN) turns much more smoothly and locks up less.",
            ],
          },
        ],
        milestones: [
          { id: "f0-m1", text: "I did 12 solves in Phase mode and have my baseline ao12" },
          { id: "f0-m2", text: "I know which phase is my slowest" },
          { id: "f0-m3", text: "I have a cube that turns smoothly (ideally magnetic)" },
        ],
      },
      {
        id: "f1",
        title: "Phase 1 · Fluency with your method",
        weeks: "Weeks 1–2",
        goal: "ao12 under 1:00",
        goalMs: 60000,
        summary:
          "With the same method you can cut a lot of time just by eliminating pauses, unnecessary cube rotations and clumsy finger movements.",
        sections: [
          {
            heading: "Technique",
            items: [
              "<b>Cross on the bottom:</b> make the white cross and then rotate the cube to put it on the bottom, or better yet, build it directly on the bottom. It's hard at first, but it saves you rotating the cube later and it's the foundation of everything else.",
              "<b>Basic finger tricks:</b> <code>U</code> with the right index finger, <code>U'</code> with the left index finger, <code>R</code>/<code>R'</code> with the wrist. The goal is to turn without changing your grip (no <i>regrips</i>).",
              "<b>Fewer rotations:</b> to look for a piece, turn the <code>U</code> layer instead of rotating the whole cube.",
              "Learn the notation (<code>R U R' U'</code>, <code>U2</code>, etc.) if you haven't mastered it yet: you'll need it for the Trainer tab.",
            ],
          },
          {
            heading: "Exercises",
            items: [
              "<b>Sexy move:</b> repeat <code>R U R' U'</code> 6 times in a row (the cube ends up exactly as it started). Time it; goal: under 4 s without changing your grip.",
              "<b>Slow solves without pauses:</b> solve turning slowly but <i>never stopping</i>. It forces your eyes to stay ahead of your hands (lookahead). 3–5 per session.",
            ],
          },
        ],
        milestones: [
          { id: "f1-m1", text: "I build the cross with white on the bottom in every solve" },
          { id: "f1-m2", text: "6 × R U R' U' in under 4 s, no regrips" },
          { id: "f1-m3", text: "I look for pieces by turning U instead of rotating the cube" },
          { id: "f1-m4", text: "ao12 under 1:00" },
        ],
      },
      {
        id: "f2",
        title: "Phase 2 · Intuitive F2L",
        weeks: "Weeks 3–6",
        goal: "ao12 under 45 s",
        goalMs: 45000,
        summary:
          "The big leap. Instead of placing the first-layer corners and then the second-layer edges separately, you pair each corner with its edge up top and insert them together in 3–8 moves.",
        sections: [
          {
            heading: "The idea",
            items: [
              "A <b>pair</b> = a white corner + the second-layer edge that goes next to it. There are 4 pairs (4 slots).",
              "Basic case 1 — pair already formed, above the front-right slot: <code>U R U' R'</code> or <code>R U R'</code> depending on which way the white faces.",
              "Basic case 2 — corner and edge separated in the top layer: bring the corner above its slot, <i>move it out of the way</i> by shifting the empty slot (<code>R U R'</code>), line up the edge and join them again.",
              "If a piece is stuck in a wrong slot, pop it out with <code>R U R'</code> (or its mirror <code>L' U' L</code>) and treat it as a normal case.",
              "Use the right-hand slots with your right hand (<code>R U R'</code>) and the left-hand ones with your left (<code>L' U' L</code>); avoid rotating the cube.",
            ],
          },
          {
            heading: "How to practice",
            items: [
              "Week 3: solve the cross and then only <b>one</b> pair, very slowly, understanding why it works. Repeat with several scrambles.",
              "Week 4: all 4 pairs, with no timer. It's normal to be slower than with your old method for 1–2 weeks; hang in there.",
              "Weeks 5–6: go back to the timer with Phase mode, <i>CFOP</i> preset. F2L should be ~50% of your time.",
              "Look for \"intuitive F2L\" video tutorials: watching the pieces move helps a lot in this phase.",
            ],
          },
        ],
        milestones: [
          { id: "f2-m1", text: "I insert a pair understanding why, not from memory" },
          { id: "f2-m2", text: "I solve all 4 slots with intuitive F2L without going back to the old method" },
          { id: "f2-m3", text: "I pop out stuck pieces from wrong slots without getting lost" },
          { id: "f2-m4", text: "ao12 under 45 s" },
        ],
      },
      {
        id: "f3",
        title: "Phase 3 · Four-look last layer (4LLL)",
        weeks: "Weeks 5–10",
        goal: "ao12 under 35 s",
        goalMs: 35000,
        summary:
          "Replace the beginner-method last layer with 16 algorithms in 4 steps: orient edges → orient corners → permute corners → permute edges. All of them are in the Trainer tab.",
        sections: [
          {
            heading: "Recommended order",
            items: [
              "<b>Yellow cross</b> (3 cases): you probably already know <code>F R U R' U' F'</code>; add the <code>f</code> version and the dot case.",
              "<b>Sune and Antisune</b> first: they're the most frequent OCLLs and the basis of others.",
              "<b>T-perm</b> and <b>Ua/Ub</b> next: very frequent, and they'll serve you forever in full PLL.",
              "Then the rest of the OCLLs (H, Pi, U, T, L) and PLLs (Y, H, Z).",
              "Pace: 2–3 new algorithms per week. Mark them as <i>mastered</i> only when you recognize and execute them without thinking.",
            ],
          },
          {
            heading: "How to practice algorithms",
            items: [
              "In the Trainer, use <b>Practice</b> mode: apply the <i>setup</i> to a solved cube (yellow on top, green in front), recognize the case and execute it against the timer.",
              "Group algorithms into <i>triggers</i> (<code>R U R' U'</code>, <code>R' F R F'</code>…) instead of memorizing loose letters.",
              "Memorize first, then make it smooth: 10 slow, clean repetitions are worth more than 30 fast ones with mistakes.",
            ],
          },
        ],
        milestones: [
          { id: "f3-m1", text: "I've mastered the 3 yellow cross cases" },
          { id: "f3-m2", text: "I've mastered the 7 OCLLs (Sune, Antisune, H, Pi, U, T, L)" },
          { id: "f3-m3", text: "I've mastered the 2 corner cases (T-perm, Y-perm)" },
          { id: "f3-m4", text: "I've mastered the 4 edge cases (Ua, Ub, H, Z)" },
          { id: "f3-m5", text: "ao12 under 35 s" },
        ],
      },
      {
        id: "f4",
        title: "Phase 4 · Toward sub-25",
        weeks: "Months 3–6",
        goal: "ao12 under 25 s",
        goalMs: 25000,
        summary:
          "From here on, improvement comes from inspection, F2L lookahead and cutting the last layer down to 2 steps.",
        sections: [
          {
            heading: "Priorities",
            items: [
              "<b>Plan the whole cross during inspection</b> (15 s) and execute it without looking: goal ≤ 8 moves.",
              "<b>F2L lookahead:</b> while you insert one pair, you're already looking for the next. Slow solves without pauses are still the best exercise.",
              "<b>Full PLL (21):</b> start with the most frequent and easiest ones (Aa, Ab, Ja, Jb, F, Ra, Rb, Ga…). It saves a whole last-layer step.",
              "<b>Full OLL (57)</b> afterwards, bit by bit. There's no rush: full PLL pays off more first.",
            ],
          },
        ],
        milestones: [
          { id: "f4-m1", text: "I plan the entire cross during inspection in most solves" },
          { id: "f4-m2", text: "I know all 21 PLLs" },
          { id: "f4-m3", text: "ao12 under 30 s" },
          { id: "f4-m4", text: "ao12 under 25 s" },
        ],
      },
    ],

    routine: {
      title: "Daily routine (20–40 min)",
      blocks: [
        { minutes: "5", title: "Warm-up", text: "Finger tricks and algorithms you already know, slow and clean." },
        { minutes: "10–15", title: "Technical block", text: "The focus of your current phase: cases in the Trainer, slow F2L, planning crosses…" },
        { minutes: "10–15", title: "Timed block", text: "1–2 ao12 with Phase mode on." },
        { minutes: "2", title: "Review", text: "Check in Stats which phase was the slowest: that's tomorrow's focus." },
      ],
    },

    tips: [
      "Consistency over duration: 20 minutes every day beats 3 hours on Sunday.",
      "Turning slowly without pauses is faster than turning fast and stopping to look for pieces.",
      "Watch your ao12 and ao50, not your best time: records depend on luck; averages depend on your level.",
      "If your ao50 doesn't drop in 2 weeks, go back to the slowest phase in Phase mode and focus only on it.",
      "Don't look at your hands: your eyes should be searching for the next piece.",
    ],
  },

    es: {
    intro:
      "Punto de partida: más de 1 minuto con el método por capas. El plan avanza en fases; " +
      "no pases a la siguiente hasta cumplir la meta de ao12 de la actual (o casi). " +
      "Las fases 2 y 3 pueden solaparse si te sientes cómodo.",

    phases: [
      {
        id: "f0",
        title: "Fase 0 · Diagnóstico",
        weeks: "Días 1–3",
        goal: "Conocer tu punto de partida",
        goalMs: null,
        summary:
          "Antes de cambiar nada, mide. Así sabrás qué parte de la resolución te cuesta más y podrás comprobar que mejoras.",
        sections: [
          {
            heading: "Qué hacer",
            items: [
              "Activa el <b>modo Fases</b> con el preset <i>Principiante</i> (Cruz · Primera capa · Segunda capa · Última capa) y haz 12 resoluciones.",
              "Anota tu <b>ao12 base</b> y revisa en Estadísticas qué fase ocupa más porcentaje del tiempo.",
              "Revisa tu cubo: si no es un speedcube magnético, cambiarlo es la mejora más barata que existe. Uno de gama de entrada (MoYu, QiYi, YJ o GAN) gira mucho más suave y se bloquea menos.",
            ],
          },
        ],
        milestones: [
          { id: "f0-m1", text: "Hice 12 resoluciones con modo Fases y tengo mi ao12 base" },
          { id: "f0-m2", text: "Sé cuál es mi fase más lenta" },
          { id: "f0-m3", text: "Tengo un cubo que gira con suavidad (idealmente magnético)" },
        ],
      },
      {
        id: "f1",
        title: "Fase 1 · Fluidez con tu método",
        weeks: "Semanas 1–2",
        goal: "ao12 por debajo de 1:00",
        goalMs: 60000,
        summary:
          "Con el mismo método puedes bajar mucho solo eliminando pausas, giros de cubo innecesarios y movimientos torpes de dedos.",
        sections: [
          {
            heading: "Técnica",
            items: [
              "<b>Cruz abajo:</b> haz la cruz blanca y luego gira el cubo para dejarla abajo, o mejor aún, constrúyela directamente abajo. Al principio cuesta, pero te ahorra girar el cubo después y es la base de todo lo demás.",
              "<b>Finger tricks básicos:</b> <code>U</code> con el índice derecho, <code>U'</code> con el índice izquierdo, <code>R</code>/<code>R'</code> con la muñeca. El objetivo es girar sin cambiar el agarre (sin <i>regrips</i>).",
              "<b>Menos rotaciones:</b> para buscar una pieza, gira la capa <code>U</code> en vez de girar el cubo entero.",
              "Aprende la notación (<code>R U R' U'</code>, <code>U2</code>, etc.) si aún no la dominas: la necesitarás para la pestaña Entrenador.",
            ],
          },
          {
            heading: "Ejercicios",
            items: [
              "<b>Sexy move:</b> repite <code>R U R' U'</code> 6 veces seguidas (el cubo vuelve a quedar igual). Cronométralo; meta: menos de 4 s sin cambiar el agarre.",
              "<b>Resoluciones lentas sin pausas:</b> resuelve girando despacio pero <i>sin detenerte nunca</i>. Obliga a tus ojos a ir por delante de las manos (lookahead). 3–5 por sesión.",
            ],
          },
        ],
        milestones: [
          { id: "f1-m1", text: "Hago la cruz con el blanco abajo en todas las resoluciones" },
          { id: "f1-m2", text: "6 × R U R' U' en menos de 4 s, sin regrips" },
          { id: "f1-m3", text: "Busco piezas girando U en lugar de rotar el cubo" },
          { id: "f1-m4", text: "ao12 por debajo de 1:00" },
        ],
      },
      {
        id: "f2",
        title: "Fase 2 · F2L intuitivo",
        weeks: "Semanas 3–6",
        goal: "ao12 por debajo de 45 s",
        goalMs: 45000,
        summary:
          "El gran salto. En lugar de colocar las esquinas de la primera capa y luego las aristas de la segunda por separado, emparejas cada esquina con su arista arriba y las insertas juntas con 3–8 movimientos.",
        sections: [
          {
            heading: "La idea",
            items: [
              "Un <b>par</b> = una esquina blanca + la arista de la segunda capa que va a su lado. Hay 4 pares (4 ranuras).",
              "Caso básico 1 — par ya formado, sobre la ranura frontal derecha: <code>U R U' R'</code> o <code>R U R'</code> según hacia dónde mire el blanco.",
              "Caso básico 2 — esquina y arista separadas en la capa de arriba: lleva la esquina encima de su ranura, <i>sácala</i> moviendo la ranura vacía (<code>R U R'</code>), alinea la arista y vuelve a juntarlas.",
              "Si una pieza está atascada en una ranura equivocada, sácala con <code>R U R'</code> (o su espejo <code>L' U' L</code>) y trátala como un caso normal.",
              "Usa las ranuras de la derecha con la mano derecha (<code>R U R'</code>) y las de la izquierda con la izquierda (<code>L' U' L</code>); evita girar el cubo.",
            ],
          },
          {
            heading: "Cómo practicarlo",
            items: [
              "Semana 3: resuelve la cruz y luego solo <b>un</b> par, muy despacio, entendiendo por qué funciona. Repite con varias mezclas.",
              "Semana 4: los 4 pares, sin cronómetro. Es normal ir más lento que con el método anterior durante 1–2 semanas; aguanta.",
              "Semanas 5–6: vuelve al cronómetro con modo Fases preset <i>CFOP</i>. El F2L debería ser ~50 % de tu tiempo.",
              "Busca tutoriales de \"F2L intuitivo\" en vídeo: ver las piezas moverse ayuda mucho en esta fase.",
            ],
          },
        ],
        milestones: [
          { id: "f2-m1", text: "Inserto un par entendiendo el porqué, no de memoria" },
          { id: "f2-m2", text: "Resuelvo las 4 ranuras con F2L intuitivo sin volver al método antiguo" },
          { id: "f2-m3", text: "Saco piezas atascadas en ranuras incorrectas sin perderme" },
          { id: "f2-m4", text: "ao12 por debajo de 45 s" },
        ],
      },
      {
        id: "f3",
        title: "Fase 3 · Última capa en 4 pasos (4LLL)",
        weeks: "Semanas 5–10",
        goal: "ao12 por debajo de 35 s",
        goalMs: 35000,
        summary:
          "Sustituye tu última capa del método principiante por 16 algoritmos en 4 pasos: orientar aristas → orientar esquinas → permutar esquinas → permutar aristas. Todos están en la pestaña Entrenador.",
        sections: [
          {
            heading: "Orden recomendado",
            items: [
              "<b>Cruz amarilla</b> (3 casos): probablemente ya conoces <code>F R U R' U' F'</code>; añade la versión con <code>f</code> y el caso punto.",
              "<b>Sune y Antisune</b> primero: son los OCLL más frecuentes y la base de otros.",
              "<b>T-perm</b> y <b>Ua/Ub</b> después: muy frecuentes y te sirven para siempre en el PLL completo.",
              "Luego el resto de OCLL (H, Pi, U, T, L) y PLL (Y, H, Z).",
              "Ritmo: 2–3 algoritmos nuevos por semana. Márcalos como <i>dominado</i> solo cuando los reconozcas y ejecutes sin pensar.",
            ],
          },
          {
            heading: "Cómo practicar algoritmos",
            items: [
              "En el Entrenador, usa el modo <b>Practicar</b>: aplica el <i>setup</i> a un cubo resuelto (amarillo arriba, verde al frente), reconoce el caso y ejecútalo con el cronómetro.",
              "Agrupa los algoritmos en <i>triggers</i> (<code>R U R' U'</code>, <code>R' F R F'</code>…) en lugar de memorizar letras sueltas.",
              "Primero memoriza, luego hazlo fluido: 10 repeticiones lentas y limpias valen más que 30 rápidas con errores.",
            ],
          },
        ],
        milestones: [
          { id: "f3-m1", text: "Domino los 3 casos de cruz amarilla" },
          { id: "f3-m2", text: "Domino los 7 OCLL (Sune, Antisune, H, Pi, U, T, L)" },
          { id: "f3-m3", text: "Domino los 2 casos de esquinas (T-perm, Y-perm)" },
          { id: "f3-m4", text: "Domino los 4 casos de aristas (Ua, Ub, H, Z)" },
          { id: "f3-m5", text: "ao12 por debajo de 35 s" },
        ],
      },
      {
        id: "f4",
        title: "Fase 4 · Hacia sub-25",
        weeks: "Meses 3–6",
        goal: "ao12 por debajo de 25 s",
        goalMs: 25000,
        summary:
          "A partir de aquí la mejora viene de la inspección, del lookahead en F2L y de reducir la última capa a 2 pasos.",
        sections: [
          {
            heading: "Prioridades",
            items: [
              "<b>Planifica la cruz completa en la inspección</b> (15 s) y ejecútala sin mirar: meta ≤ 8 movimientos.",
              "<b>Lookahead en F2L:</b> mientras insertas un par, ya estás buscando el siguiente. Las resoluciones lentas sin pausas siguen siendo el mejor ejercicio.",
              "<b>PLL completo (21):</b> empieza por los más frecuentes y fáciles (Aa, Ab, Ja, Jb, F, Ra, Rb, Ga…). Ahorra un paso entero de la última capa.",
              "<b>OLL completo (57)</b> después, poco a poco. No tiene prisa: el PLL completo rinde más primero.",
            ],
          },
        ],
        milestones: [
          { id: "f4-m1", text: "Planifico la cruz entera en la inspección en la mayoría de resoluciones" },
          { id: "f4-m2", text: "Conozco los 21 PLL" },
          { id: "f4-m3", text: "ao12 por debajo de 30 s" },
          { id: "f4-m4", text: "ao12 por debajo de 25 s" },
        ],
      },
    ],

    routine: {
      title: "Rutina diaria (20–40 min)",
      blocks: [
        { minutes: "5", title: "Calentamiento", text: "Finger tricks y algoritmos que ya conoces, despacio y limpios." },
        { minutes: "10–15", title: "Bloque técnico", text: "El foco de tu fase actual: casos en el Entrenador, F2L lento, planificar cruces…" },
        { minutes: "10–15", title: "Bloque cronometrado", text: "1–2 ao12 con el modo Fases activado." },
        { minutes: "2", title: "Revisión", text: "Mira en Estadísticas qué fase fue la más lenta: ese es el foco de mañana." },
      ],
    },

    tips: [
      "Constancia antes que duración: 20 minutos diarios rinden más que 3 horas el domingo.",
      "Girar despacio y sin pausas es más rápido que girar rápido y pararse a buscar piezas.",
      "Mira tu ao12 y ao50, no tu mejor tiempo: los récords dependen de la suerte; los promedios, de tu nivel.",
      "Si tu ao50 no baja en 2 semanas, vuelve a la fase más lenta del modo Fases y céntrate solo en ella.",
      "No mires tus manos: tus ojos deben estar buscando la siguiente pieza.",
    ],
  },
  };

  // window.TRAINING_PLAN follows the current language (I18N); English if I18N is not available.
  Object.defineProperty(root, 'TRAINING_PLAN', {
    configurable: true,
    enumerable: true,
    get: function () {
      var I = root.I18N;
      return I && I.pick ? I.pick(PLANS) : PLANS.en;
    },
  });
  root.TRAINING_PLANS = PLANS;
  if (typeof module !== 'undefined' && module.exports) module.exports = PLANS;
})(typeof window !== 'undefined' ? window : globalThis);
