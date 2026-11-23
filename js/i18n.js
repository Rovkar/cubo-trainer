(function (root) {
  'use strict';
  // Internacionalización: inglés (por defecto) y español.
  // La preferencia de idioma es del dispositivo ('cubotrainer.lang'); nunca se guarda en los datos sincronizados.
  var KEY = 'cubotrainer.lang';
  var LANGS = ['en', 'es'];
  var hasWin = typeof window !== 'undefined';
  var listeners = [];

  var DICT = {
    en: {
      'lang.label': 'Language',
      'common.cancel': 'Cancel', 'common.ok': 'OK', 'common.close': 'Close', 'common.delete': 'Delete', 'common.import': 'Import',

      'sync.local': 'Saved in this browser', 'sync.connecting': 'Connecting…', 'sync.synced': 'Synced',
      'sync.saving': 'Saving…', 'sync.error': 'Save error',
      'sync.quota': 'Out of storage space: export a backup and delete old profiles or solves',
      'warn.noSave': 'Your progress will not be saved in this browser',

      'profile.label': 'Profile', 'profile.new.title': 'New profile', 'profile.new.btn': '+ New profile',
      'profile.default': 'Profile {n}', 'profile.newPrompt': 'Name for the new profile',
      'profile.rename.title': 'Rename profile', 'profile.renamed': 'Profile renamed',
      'profile.opt.one': '{name} ({n} solve)', 'profile.opt.many': '{name} ({n} solves)',

      'tab.timer': 'Timer', 'tab.trainer': 'Trainer', 'tab.stats': 'Stats', 'tab.plan': 'Plan', 'tab.notation': 'Notation',
      'notation.howToRead': 'How to read these moves',

      'phase.cross': 'Cross', 'phase.firstLayer': 'First layer', 'phase.secondLayer': 'Second layer',
      'phase.lastLayer': 'Last layer', 'phase.f2l': 'F2L', 'phase.oll': 'OLL', 'phase.pll': 'PLL',

      'net.aria': 'Scramble view', 'net.note': 'Scramble with white on top and green in front',
      'scramble.label': 'Scramble', 'scramble.new': 'New scramble', 'scramble.copy': 'Copy',
      'toast.copied': 'Scramble copied', 'toast.copyFail': 'Could not copy',
      'timer.hint': 'Hold Space (or tap here) and release to start',
      'timer.inspection': 'Inspection', 'timer.hold': ' · hold…', 'timer.release': 'Release to start!',
      'timer.solving': 'Solving…', 'timer.phaseNote': 'Phase: {name} (press when you finish it)',

      'set.title': '⚙ Settings', 'set.inspection': '15 s inspection', 'set.phaseMode': 'Phase mode',
      'set.phase.off': 'Off', 'set.phase.beginner': 'Beginner: Cross, First layer, Second layer, Last layer',
      'set.phase.cfop': 'CFOP: Cross, F2L, OLL, PLL', 'set.phase.custom': 'Custom',
      'set.customPhases': 'Phases (comma-separated)', 'set.customPlaceholder': 'Cross, F2L, OLL, PLL',
      'set.hideTime': 'Hide time while solving', 'set.length': 'Scramble length', 'set.showNet': 'Show scramble diagram',

      'quick.best': 'Best {time}', 'stat.single': 'Single', 'stat.mean': 'Mean',
      'stat.count.one': '{n} solve', 'stat.count.many': '{n} solves',
      'recent.title': 'Last 10 solves', 'recent.empty': 'No solves yet. Start solving!',
      'solve.delete.aria': 'Delete', 'solve.delete.confirm': 'Delete this solve?',
      'solve.title': 'Solve: {time}', 'solve.phaseTimes': 'Phase times', 'solve.cumulative': '(cumulative {time})',

      'stats.summary': 'Summary', 'stats.progress': 'Progress', 'stats.breakdown': 'Where are you losing time?',
      'stats.solves': 'Solves', 'stats.manage': 'Manage',
      'stats.current': 'Current', 'stats.best': 'Best', 'stats.time': 'Time', 'stats.date': 'Date',
      'stats.noSolves': 'No solves in this profile.',
      'stats.noPhaseData': 'No per-phase data yet. Turn on <b>Phase mode</b> in the Timer settings and do a few solves to see where you lose the most time here.',
      'stats.phaseAvg': 'Average of your last {n} solves with phases.', 'stats.slowest': 'Slowest',

      'manage.rename': 'Rename profile', 'manage.renamePrompt': 'New name for "{name}"', 'manage.delete': 'Delete profile', 'manage.csv': 'Export CSV',
      'manage.json': 'JSON backup', 'manage.import': 'Import JSON',
      'manage.deleteConfirm': 'Delete profile "{name}" with all its solves and progress?',
      'manage.importConfirm': 'Importing will replace ALL your current data. Continue?',
      'manage.imported': 'Data imported', 'manage.importFail': 'Could not import: {msg}',
      'import.invalid': 'Invalid format',
      'save.pending': 'A download is already pending', 'save.fail': 'Could not save: {msg}', 'save.errorWord': 'error',

      'chart.seconds': 'seconds', 'chart.none': 'No data yet', 'chart.goal': 'Goal: {time} ({title})', 'chart.time': 'Time',

      'status.nuevo': 'New', 'status.aprendiendo': 'Learning', 'status.dominado': 'Mastered',
      'trainer.learn': 'Learn', 'trainer.practice': 'Practice',
      'trainer.diagram.aria': 'Last layer diagram',
      'trainer.mastered': 'Mastered <b>{m}/{total}</b> · {name}',
      'trainer.statusOf': 'Status of {name}',
      'trainer.avg.one': 'Recent average: <b>{avg}</b> · {n} attempt', 'trainer.avg.many': 'Recent average: <b>{avg}</b> · {n} attempts',
      'trainer.sets': 'Sets:', 'trainer.state': 'Status:', 'trainer.all': 'All', 'trainer.notMastered': 'Not mastered',
      'trainer.noCases': 'No cases match these filters. Change the filters or mark a case as not mastered.',
      'trainer.setup': 'Setup (yellow on top, green in front):',
      'trainer.reveal': 'Show solution', 'trainer.next': 'Next case',
      'trainer.hint': 'Hold Space (or tap here) and release to start; press again to stop',
      'trainer.n4.title': 'Solving a 4x4?',
      'trainer.n4.text': 'On a 4x4 two last-layer cases can show up that never happen on a 3x3 (OLL parity and PLL parity). They need their own algorithms, and the Trainer algorithms with r, f or M need a 4x4 version.',
      'trainer.n4.btn': 'See the 4x4 section',

      'plan.situation': 'Status of {name}', 'plan.currentAo12': 'Current ao12:', 'plan.noAo12': 'not enough solves yet (need 12)',
      'plan.currentPhase': 'Current phase:', 'plan.goal': 'Goal:',
      'plan.goalMet': 'Your ao12 already meets this phase goal. Check off any milestones you are missing and move on to the next one: you are doing great.',
      'plan.allDone': 'You have completed all the phases of the plan.',
      'plan.congrats': 'Congratulations, you have completed the plan. Keep practicing and setting new goals.',
      'plan.phaseBadge': 'Current phase', 'plan.milestones': 'Milestones', 'plan.tips': 'Tips'
    },
    es: {
      'lang.label': 'Idioma',
      'common.cancel': 'Cancelar', 'common.ok': 'Aceptar', 'common.close': 'Cerrar', 'common.delete': 'Borrar', 'common.import': 'Importar',

      'sync.local': 'Guardado en este navegador', 'sync.connecting': 'Conectando…', 'sync.synced': 'Sincronizado',
      'sync.saving': 'Guardando…', 'sync.error': 'Error al guardar',
      'sync.quota': 'Sin espacio de almacenamiento: exporta una copia y borra perfiles o resoluciones antiguas',
      'warn.noSave': 'Tu progreso no se guardará en este navegador',

      'profile.label': 'Perfil', 'profile.new.title': 'Nuevo perfil', 'profile.new.btn': '+ Nuevo perfil',
      'profile.default': 'Perfil {n}', 'profile.newPrompt': 'Nombre del nuevo perfil',
      'profile.rename.title': 'Renombrar perfil', 'profile.renamed': 'Perfil renombrado',
      'profile.opt.one': '{name} ({n} resolución)', 'profile.opt.many': '{name} ({n} resoluciones)',

      'tab.timer': 'Cronómetro', 'tab.trainer': 'Entrenador', 'tab.stats': 'Estadísticas', 'tab.plan': 'Plan', 'tab.notation': 'Notación',
      'notation.howToRead': 'Cómo leer estos movimientos',

      'phase.cross': 'Cruz', 'phase.firstLayer': 'Primera capa', 'phase.secondLayer': 'Segunda capa',
      'phase.lastLayer': 'Última capa', 'phase.f2l': 'F2L', 'phase.oll': 'OLL', 'phase.pll': 'PLL',

      'net.aria': 'Vista de la mezcla', 'net.note': 'Mezcla con blanco arriba y verde al frente',
      'scramble.label': 'Mezcla', 'scramble.new': 'Nueva mezcla', 'scramble.copy': 'Copiar',
      'toast.copied': 'Mezcla copiada', 'toast.copyFail': 'No se pudo copiar',
      'timer.hint': 'Mantén Espacio (o toca aquí) y suelta para empezar',
      'timer.inspection': 'Inspección', 'timer.hold': ' · mantén…', 'timer.release': '¡Suelta para empezar!',
      'timer.solving': 'Resolviendo…', 'timer.phaseNote': 'Fase: {name} (pulsa al terminarla)',

      'set.title': '⚙ Ajustes', 'set.inspection': 'Inspección 15 s', 'set.phaseMode': 'Modo fases',
      'set.phase.off': 'Desactivado', 'set.phase.beginner': 'Principiante: Cruz, Primera capa, Segunda capa, Última capa',
      'set.phase.cfop': 'CFOP: Cruz, F2L, OLL, PLL', 'set.phase.custom': 'Personalizado',
      'set.customPhases': 'Fases (separadas por comas)', 'set.customPlaceholder': 'Cruz, F2L, OLL, PLL',
      'set.hideTime': 'Ocultar tiempo mientras resuelves', 'set.length': 'Longitud de mezcla', 'set.showNet': 'Mostrar red de la mezcla',

      'quick.best': 'Mejor {time}', 'stat.single': 'Single', 'stat.mean': 'Media',
      'stat.count.one': '{n} resolución', 'stat.count.many': '{n} resoluciones',
      'recent.title': 'Últimas 10 resoluciones', 'recent.empty': 'Aún no hay resoluciones. ¡Empieza a resolver!',
      'solve.delete.aria': 'Borrar', 'solve.delete.confirm': '¿Borrar esta resolución?',
      'solve.title': 'Resolución: {time}', 'solve.phaseTimes': 'Tiempos por fase', 'solve.cumulative': '(acumulado {time})',

      'stats.summary': 'Resumen', 'stats.progress': 'Evolución', 'stats.breakdown': '¿Dónde pierdes tiempo?',
      'stats.solves': 'Resoluciones', 'stats.manage': 'Gestión',
      'stats.current': 'Actual', 'stats.best': 'Mejor', 'stats.time': 'Tiempo', 'stats.date': 'Fecha',
      'stats.noSolves': 'Sin resoluciones en este perfil.',
      'stats.noPhaseData': 'Aún no hay datos por fase. Activa el <b>modo Fases</b> en los ajustes del Cronómetro y haz unas cuantas resoluciones para ver aquí en qué parte pierdes más tiempo.',
      'stats.phaseAvg': 'Media de tus últimas {n} resoluciones con fases.', 'stats.slowest': 'Más lenta',

      'manage.rename': 'Renombrar perfil', 'manage.renamePrompt': 'Nuevo nombre para "{name}"', 'manage.delete': 'Borrar perfil', 'manage.csv': 'Exportar CSV',
      'manage.json': 'Copia de seguridad JSON', 'manage.import': 'Importar JSON',
      'manage.deleteConfirm': '¿Borrar el perfil "{name}" con todas sus resoluciones y su progreso?',
      'manage.importConfirm': 'Importar reemplazará TODOS tus datos actuales. ¿Continuar?',
      'manage.imported': 'Datos importados', 'manage.importFail': 'No se pudo importar: {msg}',
      'import.invalid': 'Formato no válido',
      'save.pending': 'Ya hay una descarga pendiente', 'save.fail': 'No se pudo guardar: {msg}', 'save.errorWord': 'error',

      'chart.seconds': 'segundos', 'chart.none': 'Sin datos todavía', 'chart.goal': 'Meta: {time} ({title})', 'chart.time': 'Tiempo',

      'status.nuevo': 'Nuevo', 'status.aprendiendo': 'Aprendiendo', 'status.dominado': 'Dominado',
      'trainer.learn': 'Aprender', 'trainer.practice': 'Practicar',
      'trainer.diagram.aria': 'Diagrama de la última capa',
      'trainer.mastered': 'Dominados <b>{m}/{total}</b> · {name}',
      'trainer.statusOf': 'Estado de {name}',
      'trainer.avg.one': 'Media últimos: <b>{avg}</b> · {n} intento', 'trainer.avg.many': 'Media últimos: <b>{avg}</b> · {n} intentos',
      'trainer.sets': 'Conjuntos:', 'trainer.state': 'Estado:', 'trainer.all': 'Todos', 'trainer.notMastered': 'No dominados',
      'trainer.noCases': 'No hay casos con estos filtros. Cambia los filtros o marca algún caso como no dominado.',
      'trainer.setup': 'Preparación (amarillo arriba, verde al frente):',
      'trainer.reveal': 'Mostrar solución', 'trainer.next': 'Siguiente caso',
      'trainer.hint': 'Mantén Espacio (o toca aquí) y suelta para empezar; pulsa de nuevo para parar',
      'trainer.n4.title': '¿Resuelves un 4x4?',
      'trainer.n4.text': 'En un 4x4 pueden aparecer dos casos de la última capa que nunca pasan en un 3x3 (paridad de OLL y paridad de PLL). Necesitan algoritmos propios, y los algoritmos del Entrenador con r, f o M necesitan una versión de 4x4.',
      'trainer.n4.btn': 'Ver la sección de 4x4',

      'plan.situation': 'Situación de {name}', 'plan.currentAo12': 'ao12 actual:', 'plan.noAo12': 'aún no hay 12 resoluciones',
      'plan.currentPhase': 'Fase actual:', 'plan.goal': 'Meta:',
      'plan.goalMet': 'Tu ao12 ya cumple la meta de esta fase. Marca los hitos que te falten y pasa a la siguiente: vas muy bien.',
      'plan.allDone': 'Has completado todas las fases del plan.',
      'plan.congrats': 'Enhorabuena, has completado el plan. Sigue practicando y fijando nuevas metas.',
      'plan.phaseBadge': 'Fase actual', 'plan.milestones': 'Hitos', 'plan.tips': 'Consejos'
    }
  };

  // ---- nombres de fase: clave canónica por nombre (sin acentos ni mayúsculas) ----
  var PHASE_KEYS = {
    'cross': 'cross', 'cruz': 'cross',
    'first layer': 'firstLayer', 'firstlayer': 'firstLayer', 'primera capa': 'firstLayer',
    'second layer': 'secondLayer', 'secondlayer': 'secondLayer', 'segunda capa': 'secondLayer',
    'last layer': 'lastLayer', 'lastlayer': 'lastLayer', 'ultima capa': 'lastLayer',
    'f2l': 'f2l', 'oll': 'oll', 'pll': 'pll'
  };
  function normName(s) {
    var n = String(s).toLowerCase();
    if (n.normalize) n = n.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return n.replace(/\s+/g, ' ').trim();
  }

  function loadPref() {
    if (!hasWin) return 'en';
    try {
      var v = window.localStorage.getItem(KEY);
      return LANGS.indexOf(v) >= 0 ? v : 'en';
    } catch (e) { return 'en'; }
  }
  function setDocLang(l) {
    try { if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = l; } catch (e) { /* ignorar */ }
  }

  var I18N = {
    LANGS: LANGS,
    lang: 'en',
    dict: DICT, // solo lectura por convención (lo usan las pruebas)
    t: function (key, params) {
      var s = DICT[I18N.lang] && DICT[I18N.lang][key];
      if (s === undefined) s = DICT.en[key];
      if (s === undefined) return key;
      if (!params) return s;
      return s.replace(/\{(\w+)\}/g, function (m, k) { return params[k] !== undefined && params[k] !== null ? String(params[k]) : m; });
    },
    extend: function (extra) {
      LANGS.forEach(function (l) {
        var src = extra && extra[l];
        if (!src) return;
        Object.keys(src).forEach(function (k) { DICT[l][k] = src[k]; });
      });
    },
    pick: function (obj) {
      if (!obj) return obj;
      return obj[I18N.lang] !== undefined ? obj[I18N.lang] : obj.en;
    },
    setLang: function (l) {
      if (LANGS.indexOf(l) < 0) return;
      try { if (hasWin) window.localStorage.setItem(KEY, l); } catch (e) { /* ignorar */ }
      var changed = I18N.lang !== l;
      I18N.lang = l;
      setDocLang(l);
      if (changed) listeners.slice().forEach(function (fn) { try { fn(l); } catch (e) { /* ignorar */ } });
    },
    onChange: function (fn) { listeners.push(fn); },
    locale: function () { return I18N.lang === 'es' ? 'es-ES' : 'en-US'; },
    apply: function (rootEl) {
      if (!rootEl || !rootEl.querySelectorAll) return;
      function each(attr, fn) {
        var els = rootEl.querySelectorAll('[' + attr + ']');
        for (var i = 0; i < els.length; i++) fn(els[i], I18N.t(els[i].getAttribute(attr)));
      }
      each('data-i18n', function (el, s) { el.textContent = s; });
      each('data-i18n-title', function (el, s) { el.setAttribute('title', s); });
      each('data-i18n-aria', function (el, s) { el.setAttribute('aria-label', s); });
      each('data-i18n-placeholder', function (el, s) { el.setAttribute('placeholder', s); });
    },
    phaseKey: function (name) {
      if (typeof name !== 'string') return null;
      var k = PHASE_KEYS[normName(name)];
      return k || null;
    },
    phaseName: function (name) {
      var k = I18N.phaseKey(name);
      return k ? I18N.t('phase.' + k) : name;
    }
  };

  I18N.lang = loadPref();
  setDocLang(I18N.lang);

  if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
  if (hasWin) root.I18N = I18N;
})(typeof window !== 'undefined' ? window : globalThis);
