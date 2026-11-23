(function (root) {
  'use strict';

  // Seccion "Notacion": explica fisicamente que significa cada letra de movimiento.
  var isNode = typeof module !== 'undefined' && module.exports;
  var Cube = isNode ? require('./cube.js') : root.Cube;
  var Cube3D = isNode ? require('./cube3d.js') : root.Cube3D;

  // ---- Tabla unica de movimientos. `expect` es la comprobacion estructurada que usa el test:
  //      direccion de la flecha del motor sobre la cara `face` (vista por defecto). ----
  //      quick: prueba rapida en cubo resuelto (blanco arriba, verde al frente).
  var MOVES = [
    { move: 'U', group: 'face', face: 'F', expect: 'left' },
    { move: 'D', group: 'face', face: 'F', expect: 'right', callout: true,
      quick: { face: 'F', cells: [6, 7, 8], color: 'o', prime: 'r' } },
    { move: 'R', group: 'face', face: 'F', expect: 'up' },
    { move: 'L', group: 'face', face: 'F', expect: 'down', callout: true,
      quick: { face: 'F', cells: [0, 3, 6], color: 'w', prime: 'y' } },
    { move: 'F', group: 'face', face: 'F', expect: 'cw' },
    { move: 'B', group: 'face', face: 'U', expect: 'left', callout: true,
      quick: { face: 'U', cells: [0, 1, 2], color: 'r', prime: 'o' } },
    { move: 'r', group: 'trainer', face: 'F', expect: 'up' },
    { move: 'f', group: 'trainer', face: 'F', expect: 'cw' },
    { move: 'M', group: 'trainer', face: 'F', expect: 'down' },
  ];

  // ---- Textos (clave 'nt.*', en ambos idiomas) ----
  var STRINGS = {
    en: {
      'nt.title': 'How to read the move letters',
      'nt.lead': 'Every letter in a scramble or an algorithm is one physical turn of the cube. Here is exactly what each letter does with your hands, and how to check it.',
      'nt.hold.title': 'How to hold the cube',
      'nt.hold.scr': 'Scrambles: white center on top and green center facing you (red is then on your right).',
      'nt.hold.trn': 'Trainer setups: yellow center on top and green center facing you (orange is then on your right).',
      'nt.hold.never': 'Do not rotate the whole cube while you apply a sequence. A face turn never moves its own center, so the six centers are your reference. With r, f and M the middle layer also turns and carries centers, but each letter still means the same side of your hands.',
      'nt.hold.capScr': 'Scrambles', 'nt.hold.capTrn': 'Trainer setups',
      'nt.hold.altScr': 'Solved cube seen from the front: white on top (U), green in front (F), red on the right (R).',
      'nt.hold.altTrn': 'Solved cube seen from the front: yellow on top (U), green in front (F), orange on the right (R).',
      'nt.faces.title': 'The letters are faces',
      'nt.faces.text': 'Each capital letter is a face of the cube, named after its English name. The faces are always named from your point of view, with the cube held as above.',
      'nt.face.U': 'Up', 'nt.face.D': 'Down', 'nt.face.R': 'Right', 'nt.face.L': 'Left', 'nt.face.F': 'Front', 'nt.face.B': 'Back',
      'nt.mod.title': 'Modifiers: how far and which way',
      'nt.mod.x': 'Quarter turn (90°) clockwise, as if you were looking straight at that face.',
      'nt.mod.xp': 'Read it "X prime". Quarter turn counterclockwise: the opposite of X.',
      'nt.mod.x2': 'Half turn (180°). Either direction gives the same result.',
      'nt.mod.note': '"Clockwise" is always judged looking straight at the face you are turning.',
      'nt.faceMoves.title': 'The six face moves',
      'nt.faceMoves.text': 'Each card shows the cube before the move (the stickers that move are highlighted, arrows show where they go) and after doing the move once. You can copy it on your own cube to check yourself.',
      'nt.card.before': 'Before: arrows show where the highlighted stickers go',
      'nt.card.after': 'After {m}',
      'nt.alt.before': 'Solved cube with the pieces moved by {m} highlighted and arrows showing their direction.',
      'nt.alt.after': 'The solved cube after doing {m} once.',
      'nt.m.U.name': 'Up face', 'nt.m.D.name': 'Down face', 'nt.m.R.name': 'Right face', 'nt.m.L.name': 'Left face',
      'nt.m.F.name': 'Front face', 'nt.m.B.name': 'Back face',
      'nt.m.r.name': 'Right face + middle layer', 'nt.m.f.name': 'Front face + middle layer', 'nt.m.M.name': 'Middle slice',
      'nt.m.U.x': 'Turn the top face clockwise, as seen from above. The top row of the front face goes LEFT.',
      'nt.m.U.xp': 'Counterclockwise as seen from above: the top row of the front face goes RIGHT.',
      'nt.m.U.x2': 'Half turn: the top row of the front face ends up on the back.',
      'nt.m.D.x': 'Turn the bottom face clockwise, as seen from below. The bottom row of the front face goes RIGHT.',
      'nt.m.D.xp': 'Counterclockwise as seen from below: the bottom row of the front face goes LEFT.',
      'nt.m.D.x2': 'Half turn: the bottom row of the front face ends up on the back.',
      'nt.m.R.x': 'Turn the right face clockwise, as seen from the right side. The right column of the front face goes UP.',
      'nt.m.R.xp': 'Counterclockwise as seen from the right side: the right column of the front face goes DOWN.',
      'nt.m.R.x2': 'Half turn: the right column of the front face ends up on the back.',
      'nt.m.L.x': 'Turn the left face clockwise, as seen from the left side. The left column of the front face goes DOWN.',
      'nt.m.L.xp': 'Counterclockwise as seen from the left side: the left column of the front face goes UP.',
      'nt.m.L.x2': 'Half turn: the left column of the front face ends up on the back.',
      'nt.m.F.x': 'Turn the front face clockwise, exactly as you see it.',
      'nt.m.F.xp': 'Counterclockwise, exactly as you see it.',
      'nt.m.F.x2': 'Half turn of the front face.',
      'nt.m.B.x': 'Turn the back face clockwise, as seen from behind. From your side it looks counterclockwise: the row of the top face that is farthest from you moves LEFT.',
      'nt.m.B.xp': 'The opposite: that row moves RIGHT, and from your side the back face looks like it turns clockwise.',
      'nt.m.B.x2': 'Half turn of the back face.',
      'nt.m.D.call': 'D, L and B look reversed compared with U, R and F because you are not looking at those faces. Clockwise is always judged looking straight at the face you turn: for D, from below. That is why D sends the front row to the right, the opposite of U.',
      'nt.m.L.call': 'D, L and B look reversed compared with U, R and F because you are not looking at those faces. Clockwise is always judged looking straight at the face you turn: for L, from the left side. That is why L sends the front column down, the opposite of R.',
      'nt.m.B.call': 'D, L and B look reversed compared with U, R and F because you are not looking at those faces. Clockwise is always judged looking straight at the face you turn: for B, from behind.',
      'nt.quick': 'Quick test on a solved cube (white on top, green facing you): after {m}, {where} turns {c1}. If it turns {c2} instead, you did {mp}.',
      'nt.q.D': 'the bottom row of the green face',
      'nt.q.L': 'the left column of the green face',
      'nt.q.B': 'the back row of the white face',
      'nt.c.w': 'white', 'nt.c.y': 'yellow', 'nt.c.o': 'orange', 'nt.c.r': 'red',
      'nt.tr.title': "Moves you'll see in the Trainer",
      'nt.tr.note': 'Lowercase letters (or a w after the letter, as in Rw) mean two layers at once: the face and the layer next to it. So r = Rw and f = Fw. M is a slice move: it turns only the middle layer.',
      'nt.m.r.x': 'Turn the right face and the middle layer together, in the same direction as R. The two right columns of the front face go UP.',
      'nt.m.r.xp': 'The opposite: the two right columns of the front face go DOWN.',
      'nt.m.r.x2': 'Half turn of the two right layers.',
      'nt.m.f.x': 'Turn the front face and the layer right behind it together, in the same direction as F (clockwise as you look at the front).',
      'nt.m.f.xp': 'The opposite: counterclockwise as you look at the front.',
      'nt.m.f.x2': 'Half turn of the two front layers.',
      'nt.m.M.x': 'Turn only the middle slice between L and R. It turns like L: the middle column of the front face goes DOWN.',
      'nt.m.M.xp': 'The opposite: the middle column of the front face goes UP.',
      'nt.m.M.x2': 'Half turn of the middle slice.',
    },
    es: {
      'nt.title': 'Cómo leer las letras de los movimientos',
      'nt.lead': 'Cada letra de una mezcla o de un algoritmo es un giro físico del cubo. Aquí ves exactamente qué hace cada letra con tus manos y cómo comprobarlo.',
      'nt.hold.title': 'Cómo sostener el cubo',
      'nt.hold.scr': 'Mezclas: centro blanco arriba y centro verde mirando hacia ti (así el rojo queda a tu derecha).',
      'nt.hold.trn': 'Posiciones del Entrenador: centro amarillo arriba y centro verde mirando hacia ti (así el naranja queda a tu derecha).',
      'nt.hold.never': 'No gires el cubo entero mientras aplicas una secuencia. Un giro de cara nunca mueve su propio centro, así que los seis centros son tu referencia. Con r, f y M la capa del medio también gira y arrastra centros, pero cada letra sigue significando el mismo lado de tus manos.',
      'nt.hold.capScr': 'Mezclas', 'nt.hold.capTrn': 'Posiciones del Entrenador',
      'nt.hold.altScr': 'Cubo resuelto visto de frente: blanco arriba (U), verde al frente (F), rojo a la derecha (R).',
      'nt.hold.altTrn': 'Cubo resuelto visto de frente: amarillo arriba (U), verde al frente (F), naranja a la derecha (R).',
      'nt.faces.title': 'Las letras son caras',
      'nt.faces.text': 'Cada letra mayúscula es una cara del cubo y es la inicial de su nombre en inglés. Las caras siempre se cuentan desde tu punto de vista, con el cubo sostenido como arriba.',
      'nt.face.U': 'Arriba (Up)', 'nt.face.D': 'Abajo (Down)', 'nt.face.R': 'Derecha (Right)', 'nt.face.L': 'Izquierda (Left)', 'nt.face.F': 'Frente (Front)', 'nt.face.B': 'Atrás (Back)',
      'nt.mod.title': 'Modificadores: cuánto y hacia dónde',
      'nt.mod.x': 'Cuarto de vuelta (90°) en sentido horario, como si miraras esa cara de frente.',
      'nt.mod.xp': 'Se lee «X prima». Cuarto de vuelta en sentido antihorario: lo contrario de X.',
      'nt.mod.x2': 'Media vuelta (180°). Da igual el sentido.',
      'nt.mod.note': '«Horario» siempre se juzga mirando de frente la cara que giras.',
      'nt.faceMoves.title': 'Los seis movimientos de cara',
      'nt.faceMoves.text': 'Cada tarjeta muestra el cubo antes del movimiento (las piezas que se mueven están resaltadas y las flechas indican adónde van) y después de hacerlo una vez. Puedes copiarlo en tu cubo para comprobarlo.',
      'nt.card.before': 'Antes: las flechas muestran adónde van las piezas resaltadas',
      'nt.card.after': 'Después de {m}',
      'nt.alt.before': 'Cubo resuelto con las piezas que mueve {m} resaltadas y flechas que muestran su dirección.',
      'nt.alt.after': 'El cubo resuelto después de hacer {m} una vez.',
      'nt.m.U.name': 'Cara de arriba', 'nt.m.D.name': 'Cara de abajo', 'nt.m.R.name': 'Cara derecha', 'nt.m.L.name': 'Cara izquierda',
      'nt.m.F.name': 'Cara frontal', 'nt.m.B.name': 'Cara de atrás',
      'nt.m.r.name': 'Cara derecha + capa del medio', 'nt.m.f.name': 'Cara frontal + capa del medio', 'nt.m.M.name': 'Capa del medio',
      'nt.m.U.x': 'Gira la cara de arriba en sentido horario, visto desde arriba. La fila superior de la cara frontal se va a la IZQUIERDA.',
      'nt.m.U.xp': 'Antihorario visto desde arriba: la fila superior de la cara frontal se va a la DERECHA.',
      'nt.m.U.x2': 'Media vuelta: la fila superior de la cara frontal termina atrás.',
      'nt.m.D.x': 'Gira la cara de abajo en sentido horario, visto desde abajo. La fila inferior de la cara frontal se va a la DERECHA.',
      'nt.m.D.xp': 'Antihorario visto desde abajo: la fila inferior de la cara frontal se va a la IZQUIERDA.',
      'nt.m.D.x2': 'Media vuelta: la fila inferior de la cara frontal termina atrás.',
      'nt.m.R.x': 'Gira la cara derecha en sentido horario, visto desde la derecha. La columna derecha de la cara frontal SUBE.',
      'nt.m.R.xp': 'Antihorario visto desde la derecha: la columna derecha de la cara frontal BAJA.',
      'nt.m.R.x2': 'Media vuelta: la columna derecha de la cara frontal termina atrás.',
      'nt.m.L.x': 'Gira la cara izquierda en sentido horario, visto desde el lado izquierdo. La columna izquierda de la cara frontal BAJA.',
      'nt.m.L.xp': 'Antihorario visto desde el lado izquierdo: la columna izquierda de la cara frontal SUBE.',
      'nt.m.L.x2': 'Media vuelta: la columna izquierda de la cara frontal termina atrás.',
      'nt.m.F.x': 'Gira la cara frontal en sentido horario, tal como la ves.',
      'nt.m.F.xp': 'Antihorario, tal como lo ves.',
      'nt.m.F.x2': 'Media vuelta de la cara frontal.',
      'nt.m.B.x': 'Gira la cara de atrás en sentido horario, visto desde atrás. Desde tu lado parece antihorario: la fila de la cara de arriba más lejana a ti se va a la IZQUIERDA.',
      'nt.m.B.xp': 'Lo contrario: esa fila se va a la DERECHA y, desde tu lado, la cara de atrás parece girar en sentido horario.',
      'nt.m.B.x2': 'Media vuelta de la cara de atrás.',
      'nt.m.D.call': 'D, L y B parecen al revés que U, R y F porque no estás mirando esas caras. «Horario» siempre se juzga mirando de frente la cara que giras: en D, desde abajo. Por eso D manda la fila frontal a la derecha, al revés que U.',
      'nt.m.L.call': 'D, L y B parecen al revés que U, R y F porque no estás mirando esas caras. «Horario» siempre se juzga mirando de frente la cara que giras: en L, desde el lado izquierdo. Por eso L baja la columna frontal, al revés que R.',
      'nt.m.B.call': 'D, L y B parecen al revés que U, R y F porque no estás mirando esas caras. «Horario» siempre se juzga mirando de frente la cara que giras: en B, desde atrás.',
      'nt.quick': 'Prueba rápida en un cubo resuelto (blanco arriba, verde hacia ti): después de {m}, {where} queda de color {c1}. Si queda de color {c2}, hiciste {mp}.',
      'nt.q.D': 'la fila de abajo de la cara verde',
      'nt.q.L': 'la columna izquierda de la cara verde',
      'nt.q.B': 'la fila de atrás de la cara blanca',
      'nt.c.w': 'blanco', 'nt.c.y': 'amarillo', 'nt.c.o': 'naranja', 'nt.c.r': 'rojo',
      'nt.tr.title': 'Movimientos que verás en el Entrenador',
      'nt.tr.note': 'Las letras minúsculas (o una w después de la letra, como en Rw) significan dos capas a la vez: la cara y la capa de al lado. Así, r = Rw y f = Fw. M es un movimiento de capa: gira solo la capa del medio.',
      'nt.m.r.x': 'Gira la cara derecha junto con la capa del medio, en el mismo sentido que R. Las dos columnas derechas de la cara frontal SUBEN.',
      'nt.m.r.xp': 'Lo contrario: las dos columnas derechas de la cara frontal BAJAN.',
      'nt.m.r.x2': 'Media vuelta de las dos capas de la derecha.',
      'nt.m.f.x': 'Gira la cara frontal junto con la capa que tiene justo detrás, en el mismo sentido que F (horario mirando el frente).',
      'nt.m.f.xp': 'Lo contrario: antihorario mirando el frente.',
      'nt.m.f.x2': 'Media vuelta de las dos capas del frente.',
      'nt.m.M.x': 'Gira solo la capa del medio entre L y R. Gira como L: la columna central de la cara frontal BAJA.',
      'nt.m.M.xp': 'Lo contrario: la columna central de la cara frontal SUBE.',
      'nt.m.M.x2': 'Media vuelta de la capa del medio.',
    },
  };

  if (root.I18N && root.I18N.extend) root.I18N.extend(STRINGS);

  // t(): con I18N usa el idioma actual; sin I18N (Node) o con `lang` explicito usa STRINGS.
  function fill(s, params) {
    if (!params) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return params[k] != null ? String(params[k]) : m; });
  }
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

  // ---- Diagramas (cacheados por idioma) ----
  var cache = {};
  function memo(key, fn) { return cache[key] || (cache[key] = fn()); }
  function primeOf(m) { return m + "'"; }

  function holdSvg(scheme, alt, lang) {
    return memo('hold|' + scheme + '|' + lang, function () {
      return Cube3D.svg(Cube.solved(scheme), { labels: true, size: 170, title: alt });
    });
  }
  function beforeSvg(m, lang) {
    return memo('b|' + m + '|' + lang, function () {
      return Cube3D.svg(Cube.solved('wca'), {
        highlight: m, arrows: m, size: 150, title: t('nt.alt.before', { m: m }, lang),
      });
    });
  }
  function afterState(m) { return Cube.applyAlg(Cube.solved('wca'), m); }
  function afterSvg(m, lang) {
    return memo('a|' + m + '|' + lang, function () {
      return Cube3D.svg(afterState(m), { size: 150, title: t('nt.alt.after', { m: m }, lang) });
    });
  }

  function figure(svg, caption) {
    return '<figure class="nt-fig">' + svg + '<figcaption>' + esc(caption) + '</figcaption></figure>';
  }

  function cardHtml(mv, lang) {
    var m = mv.move, x = m, xp = primeOf(m), x2 = m + '2';
    var h = '<article class="card nt-card" data-move="' + m + '">';
    h += '<header class="nt-card-head"><span class="nt-big">' + esc(m) + '</span><span class="nt-name">' + esc(t('nt.m.' + m + '.name', null, lang)) + '</span></header>';
    h += '<div class="nt-figs">' + figure(beforeSvg(m, lang), t('nt.card.before', null, lang)) +
      figure(afterSvg(m, lang), t('nt.card.after', { m: m }, lang)) + '</div>';
    h += '<ul class="nt-lines">' +
      '<li><b class="nt-mv">' + esc(x) + '</b> <span>' + esc(t('nt.m.' + m + '.x', null, lang)) + '</span></li>' +
      '<li><b class="nt-mv">' + esc(xp) + '</b> <span>' + esc(t('nt.m.' + m + '.xp', null, lang)) + '</span></li>' +
      '<li><b class="nt-mv">' + esc(x2) + '</b> <span>' + esc(t('nt.m.' + m + '.x2', null, lang)) + '</span></li>' +
      '</ul>';
    if (mv.callout) h += '<p class="nt-callout" role="note">' + esc(t('nt.m.' + m + '.call', null, lang)) + '</p>';
    if (mv.quick) {
      h += '<p class="nt-quick">' + esc(t('nt.quick', {
        m: m, mp: xp, where: t('nt.q.' + m, null, lang),
        c1: t('nt.c.' + mv.quick.color, null, lang), c2: t('nt.c.' + mv.quick.prime, null, lang),
      }, lang)) + '</p>';
    }
    return h + '</article>';
  }

  function build(lang) {
    lang = lang || curLang();
    return memo('html|' + lang, function () {
      var T = function (k, p) { return t(k, p, lang); };
      var faceMoves = MOVES.filter(function (m) { return m.group === 'face'; });
      var trainer = MOVES.filter(function (m) { return m.group === 'trainer'; });
      var h = '<h2 class="nt-title">' + esc(T('nt.title')) + '</h2><p class="nt-lead">' + esc(T('nt.lead')) + '</p>';

      h += '<section class="card nt-hold"><h3>' + esc(T('nt.hold.title')) + '</h3><div class="nt-hold-body"><div class="nt-hold-text">' +
        '<p>' + esc(T('nt.hold.scr')) + '</p><p>' + esc(T('nt.hold.trn')) + '</p><p class="nt-never">' + esc(T('nt.hold.never')) + '</p></div>' +
        '<div class="nt-figs">' + figure(holdSvg('wca', T('nt.hold.altScr'), lang), T('nt.hold.capScr')) +
        figure(holdSvg('yellowTop', T('nt.hold.altTrn'), lang), T('nt.hold.capTrn')) + '</div></div></section>';

      h += '<section class="card nt-faces"><h3>' + esc(T('nt.faces.title')) + '</h3><p>' + esc(T('nt.faces.text')) + '</p><ul class="nt-chips">';
      ['U', 'D', 'R', 'L', 'F', 'B'].forEach(function (f) {
        h += '<li><span class="nt-letter">' + f + '</span><span>' + esc(T('nt.face.' + f)) + '</span></li>';
      });
      h += '</ul></section>';

      h += '<section class="card nt-mods"><h3>' + esc(T('nt.mod.title')) + '</h3><ul class="nt-lines">' +
        '<li><b class="nt-mv">X</b> <span>' + esc(T('nt.mod.x')) + '</span></li>' +
        "<li><b class=\"nt-mv\">X'</b> <span>" + esc(T('nt.mod.xp')) + '</span></li>' +
        '<li><b class="nt-mv">X2</b> <span>' + esc(T('nt.mod.x2')) + '</span></li></ul>' +
        '<p class="nt-note">' + esc(T('nt.mod.note')) + '</p></section>';

      h += '<h3 class="nt-sec">' + esc(T('nt.faceMoves.title')) + '</h3><p class="nt-lead">' + esc(T('nt.faceMoves.text')) + '</p><div class="nt-grid">';
      faceMoves.forEach(function (mv) { h += cardHtml(mv, lang); });
      h += '</div>';

      h += '<h3 class="nt-sec">' + esc(T('nt.tr.title')) + '</h3><p class="nt-lead">' + esc(T('nt.tr.note')) + '</p><div class="nt-grid">';
      trainer.forEach(function (mv) { h += cardHtml(mv, lang); });
      h += '</div>';
      return h;
    });
  }

  // ---- Modo de puzzle (3x3 / 4x4): preferencia del dispositivo, vive en js/puzzle.js (clave 'cubotrainer.ntSize') ----
  // La pestana muestra la vista 4x4 cuando Puzzle.is4() y la de 3x3 en caso contrario. El cambio de modo lo hace el
  // selector de la cabecera; app.js vuelve a pintar la pestana (NotationView.render) al cambiar.
  function puzzle() {
    if (root.Puzzle) return root.Puzzle;
    if (isNode) { try { return require('./puzzle.js'); } catch (e) { /* ignorar */ } }
    return null;
  }

  var el = null;
  var NotationView = {
    MOVES: MOVES,
    STRINGS: STRINGS,
    afterState: afterState,
    build: build,
    mount: function (e) {
      el = e;
      if (el && el.classList) el.classList.add('nt');
      NotationView.render();
    },
    size: function () { var P = puzzle(); return P ? P.current() : '3x3'; },
    // Alias fino por compatibilidad: el modo es global (Puzzle.set); aqui solo se repinta
    setSize: function (s) {
      var P = puzzle();
      if (P) P.set(s);
      NotationView.render();
    },
    render: function () {
      if (!el) return;
      var P = puzzle(), lang = curLang(), four = !!(P && P.is4() && root.Notation4View);
      el.innerHTML = four ? root.Notation4View.build(lang) : build(lang);
    },
  };

  if (isNode) module.exports = NotationView;
  else root.NotationView = NotationView;
})(typeof window !== 'undefined' ? window : globalThis);
