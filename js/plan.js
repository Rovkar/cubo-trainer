// Contenido del plan de entrenamiento (datos). La app lo renderiza en la pestaña "Plan".
// Los textos admiten HTML simple (<b>, <i>, <code>).
// goalMs: meta de ao12 en milisegundos para considerar superada la fase (null = sin meta de tiempo).
window.TRAINING_PLAN = {
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
};
