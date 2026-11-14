(function () {
  'use strict';
  var S = Storage, St = Stats;
  var $ = function (id) { return document.getElementById(id); };
  var esc = escHtml;
  var F = St.formatTime;
  var tab = 'timer';
  var scramble = '';
  var timer = null;
  var els = {};

  var PRESETS = {
    beginner: ['Cruz', 'Primera capa', 'Segunda capa', 'Última capa'],
    cfop: ['Cruz', 'F2L', 'OLL', 'PLL']
  };

  function phaseList() {
    var s = S.settings();
    if (s.phaseMode === 'off') return null;
    if (PRESETS[s.phaseMode]) return PRESETS[s.phaseMode];
    var l = (s.customPhases || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    return l.length ? l : null;
  }
  function times() { return S.activeSession().solves.map(St.effectiveTime); }
  function fmtSolve(s) {
    var e = St.effectiveTime(s);
    if (s.penalty === 'DNF') return 'DNF(' + F(s.time) + ')';
    return F(e) + (s.penalty === '+2' ? '+' : '');
  }
  function fmtDate(d) { try { return new Date(d).toLocaleString('es'); } catch (e) { return ''; } }

  // ---------- red en cruz ----------
  function netSvg(state) {
    var C = Cube.COLORS, pos = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };
    var out = '<svg class="net" viewBox="-1 -1 122 92" role="img" aria-label="Vista de la mezcla">';
    Object.keys(pos).forEach(function (f) {
      for (var i = 0; i < 9; i++) {
        var x = (pos[f][0] + i % 3) * 10 + 1, y = (pos[f][1] + Math.floor(i / 3)) * 10 + 1;
        out += '<rect x="' + x + '" y="' + y + '" width="9" height="9" rx="1.5" fill="' + C[state[f][i]] + '" stroke="var(--stk)" stroke-width="0.4"/>';
      }
    });
    return out + '</svg>';
  }

  // ---------- modal ----------
  function modal(html) {
    var b = document.createElement('div');
    b.className = 'modal-backdrop';
    b.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="btn small-btn modal-x" aria-label="Cerrar">✕</button>' + html + '</div>';
    function close() { b.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    b.addEventListener('click', function (e) { if (e.target === b || e.target.closest('.modal-x')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(b);
    return b;
  }
  function solveModal(id) {
    var sv = S.activeSession().solves.filter(function (x) { return x.id === id; })[0];
    if (!sv) return;
    var h = '<h3>Resolución: ' + esc(fmtSolve(sv)) + '</h3><p class="muted">' + esc(fmtDate(sv.date)) + '</p>' +
      '<p class="muted small">Mezcla</p><code class="alg">' + esc(sv.scramble) + '</code>';
    if (sv.splits && sv.phases) {
      h += '<p class="muted small">Tiempos por fase</p><ul class="plain">';
      sv.phases.forEach(function (n, i) {
        h += '<li>' + esc(n) + ': <b>' + F(sv.splits[i] - (i ? sv.splits[i - 1] : 0)) + '</b> <span class="muted">(acumulado ' + F(sv.splits[i]) + ')</span></li>';
      });
      h += '</ul>';
    }
    modal(h);
  }

  // ---------- pestañas ----------
  function showTab(t) {
    tab = t;
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    ['timer', 'trainer', 'stats', 'plan'].forEach(function (v) { $('view-' + v).hidden = v !== t; });
    Trainer.setActive(t === 'trainer');
    if (t === 'stats' || t === 'plan') ScreenWake.release();
    if (timer && t !== 'timer') timer.reset(false);
    if (t === 'stats') renderStats();
    if (t === 'plan') PlanView.render();
    if (t === 'timer') renderTimerSide();
    window.scrollTo(0, 0);
  }

  // ---------- perfiles ----------
  function renderSessions() {
    var d = S.get();
    $('session-select').innerHTML = d.sessions.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === d.activeSessionId ? ' selected' : '') + '>' + esc(s.name) + ' (' + s.solves.length + (s.solves.length === 1 ? ' resolución' : ' resoluciones') + ')</option>';
    }).join('');
  }
  function refreshAll() {
    renderSessions();
    renderTimerSide();
    if (tab === 'stats') renderStats();
    if (tab === 'plan') PlanView.render();
  }

  // ---------- cronómetro ----------
  function buildTimerView() {
    $('view-timer').innerHTML =
      '<div class="card scramble-card"><div class="scramble-head"><span class="muted small">Mezcla</span>' +
      '<span><button class="btn small-btn" id="b-new">Nueva mezcla</button> <button class="btn small-btn" id="b-copy">Copiar</button></span></div>' +
      '<div id="scramble" class="scramble"></div>' +
      '<div id="net-wrap"><div id="net"></div><div class="muted small">Mezcla con blanco arriba y verde al frente</div></div></div>' +
      '<div id="tzone" class="timer-zone" tabindex="-1"><div id="insp-note" class="insp-note"></div><div id="time" class="time">0.00</div>' +
      '<div class="muted small" id="hint">Mantén Espacio (o toca aquí) y suelta para empezar</div></div>' +
      '<div id="phases" class="phases"></div>' +
      '<details class="card settings" id="settings"><summary>⚙ Ajustes</summary><div class="settings-grid">' +
      '<label class="check"><input type="checkbox" id="s-insp"> Inspección 15 s</label>' +
      '<label>Modo fases <select id="s-phase"><option value="off">Desactivado</option>' +
      '<option value="beginner">Principiante: Cruz, Primera capa, Segunda capa, Última capa</option>' +
      '<option value="cfop">CFOP: Cruz, F2L, OLL, PLL</option><option value="custom">Personalizado</option></select></label>' +
      '<label id="s-custom-wrap">Fases (separadas por comas) <input type="text" id="s-custom" placeholder="Cruz, F2L, OLL, PLL"></label>' +
      '<label class="check"><input type="checkbox" id="s-hide"> Ocultar tiempo mientras resuelves</label>' +
      '<label>Longitud de mezcla <input type="number" id="s-len" min="20" max="25" style="width:70px"></label>' +
      '<label class="check"><input type="checkbox" id="s-net"> Mostrar red de la mezcla</label>' +
      '</div></details>' +
      '<div class="card"><div id="quick" class="quick"></div></div>' +
      '<div class="card"><h3>Últimas 10 resoluciones</h3><div id="recent"></div></div>';
    var s = S.settings();
    $('s-insp').checked = s.inspection; $('s-phase').value = s.phaseMode; $('s-custom').value = s.customPhases;
    $('s-hide').checked = s.hideTime; $('s-len').value = s.scrambleLength; $('s-net').checked = s.showNet;
    $('s-custom-wrap').style.display = s.phaseMode === 'custom' ? '' : 'none';

    $('b-new').onclick = newScramble;
    $('b-copy').onclick = function () {
      var done = function () { toast('Mezcla copiada'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(scramble).then(done, fallback);
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = scramble; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { toast('No se pudo copiar'); }
        ta.remove();
      }
    };
    $('s-insp').onchange = function () { S.setting('inspection', this.checked); };
    $('s-phase').onchange = function () {
      S.setting('phaseMode', this.value);
      $('s-custom-wrap').style.display = this.value === 'custom' ? '' : 'none';
      renderPhases({ state: 'idle', splits: [], ms: 0 });
    };
    $('s-custom').onchange = function () { S.setting('customPhases', this.value); renderPhases({ state: 'idle', splits: [], ms: 0 }); };
    $('s-hide').onchange = function () { S.setting('hideTime', this.checked); };
    $('s-len').onchange = function () {
      var v = Math.max(20, Math.min(25, parseInt(this.value, 10) || 20)); this.value = v;
      S.setting('scrambleLength', v); newScramble();
    };
    $('s-net').onchange = function () { S.setting('showNet', this.checked); drawNet(); };
    $('recent').addEventListener('click', onSolveAction);

    timer = new CubeTimer({
      el: $('tzone'),
      isActive: function () { return tab === 'timer'; },
      getOptions: function () { return { inspection: S.settings().inspection, phases: phaseList() }; },
      onUpdate: paintTimer,
      onFinish: function (r) {
        S.addSolve({ time: r.time, penalty: r.penalty, scramble: scramble, date: Date.now(), splits: r.splits, phases: r.phases });
        newScramble();
        renderSessions(); renderTimerSide();
      }
    });
  }

  function paintTimer(t) {
    var z = $('tzone'), disp = $('time'), note = $('insp-note'), hint = $('hint');
    if (!z) return;
    var cls = 'timer-zone st-' + t.state + (t.inspecting || t.inspLeft !== null ? ' insp' : '');
    z.className = cls;
    var txt, n = '';
    if (t.inspLeft !== null && t.state !== 'running') {
      var el = t.inspLeft;
      txt = el < 15000 ? String(Math.ceil((15000 - el) / 1000)) : el < 17000 ? '+2' : 'DNF';
      n = t.inspWarn ? t.inspWarn + ' s' : 'Inspección';
      if (t.state === 'holding') n += ' · mantén…';
      if (t.state === 'ready') n = '¡Suelta para empezar!';
    } else if (t.state === 'running') {
      txt = S.settings().hideTime ? 'Resolviendo…' : F(t.ms);
      var ph = phaseList();
      if (ph) n = 'Fase: ' + ph[Math.min(t.splits.length, ph.length - 1)] + ' (pulsa al terminarla)';
    } else if (t.state === 'idle') txt = '0.00';
    else txt = F(t.ms);
    disp.textContent = txt;
    disp.classList.toggle('small-txt', txt === 'Resolviendo…');
    note.textContent = n;
    hint.style.visibility = t.state === 'idle' ? 'visible' : 'hidden';
    renderPhases(t);
  }

  function renderPhases(t) {
    var ph = phaseList(), box = $('phases');
    if (!box) return;
    if (!ph) { box.innerHTML = ''; return; }
    var h = '<ul class="phase-list">';
    ph.forEach(function (n, i) {
      var v = '–', cls = '';
      if (i < t.splits.length) v = F(t.splits[i] - (i ? t.splits[i - 1] : 0));
      else if (i === t.splits.length && t.state === 'running') {
        v = S.settings().hideTime ? '…' : F(t.ms - (i ? t.splits[i - 1] : 0)); cls = ' cur';
      }
      h += '<li class="' + cls + '"><span>' + esc(n) + '</span><b>' + v + '</b></li>';
    });
    box.innerHTML = h + '</ul>';
  }

  function newScramble() {
    var len = S.settings().scrambleLength;
    scramble = Cube.randomScramble(len);
    $('scramble').textContent = scramble;
    drawNet();
  }
  function drawNet() {
    var show = S.settings().showNet;
    $('net-wrap').style.display = show ? '' : 'none';
    if (!show) return;
    try { $('net').innerHTML = netSvg(Cube.applyAlg(Cube.solved('wca'), scramble)); }
    catch (e) { $('net').innerHTML = ''; }
  }

  function summary(arr) {
    var cur = arr.length ? arr[arr.length - 1] : null;
    var o = { cur: cur, best: St.bestSingle(arr) };
    [5, 12, 50, 100].forEach(function (n) {
      var r = St.rollingAverage(arr, n);
      o['ao' + n] = r.length ? r[r.length - 1] : null;
      o['bao' + n] = St.bestAverage(arr, n);
    });
    o.mean = St.mean(arr); o.n = arr.length;
    return o;
  }

  function renderTimerSide() {
    if (!$('quick')) return;
    var a = times(), o = summary(a);
    function q(l, c, b) { return '<div class="q"><div class="q-l">' + l + '</div><div class="q-v">' + F(c) + '</div><div class="muted small">Mejor ' + F(b) + '</div></div>'; }
    $('quick').innerHTML = q('Single', o.cur, o.best) + q('ao5', o.ao5, o.bao5) + q('ao12', o.ao12, o.bao12) +
      '<div class="q"><div class="q-l">Media</div><div class="q-v">' + F(o.mean) + '</div><div class="muted small">' + o.n + ' resoluciones</div></div>';
    var sv = S.activeSession().solves, last = sv.slice(-10).reverse();
    $('recent').innerHTML = last.length ? '<ul class="solves">' + last.map(function (s, i) {
      return '<li data-id="' + s.id + '"><span class="muted n">' + (sv.length - i) + '</span>' +
        '<a href="#" class="stime" data-a="view">' + esc(fmtSolve(s)) + '</a>' + actionsHtml(s) + '</li>';
    }).join('') + '</ul>' : '<p class="muted">Aún no hay resoluciones. ¡Empieza a resolver!</p>';
  }
  function actionsHtml(s) {
    return '<span class="acts"><button class="btn tiny' + (!s.penalty ? ' on' : '') + '" data-a="ok">OK</button>' +
      '<button class="btn tiny' + (s.penalty === '+2' ? ' on' : '') + '" data-a="p2">+2</button>' +
      '<button class="btn tiny' + (s.penalty === 'DNF' ? ' on' : '') + '" data-a="dnf">DNF</button>' +
      '<button class="btn tiny danger" data-a="del" aria-label="Borrar">🗑</button></span>';
  }
  function onSolveAction(e) {
    var t = e.target.closest('[data-a]'), li = e.target.closest('[data-id]');
    if (!t || !li) return;
    e.preventDefault();
    var id = li.dataset.id, a = t.dataset.a;
    if (a === 'view') return solveModal(id);
    if (a === 'ok') S.setPenalty(id, null);
    else if (a === 'p2') S.setPenalty(id, '+2');
    else if (a === 'dnf') S.setPenalty(id, 'DNF');
    else if (a === 'del') {
      Dialog.confirm('¿Borrar esta resolución?', { okText: 'Borrar', danger: true }).then(function (ok) {
        if (!ok) return;
        S.deleteSolve(id); afterSolveChange();
      });
      return;
    }
    afterSolveChange();
  }
  function afterSolveChange() {
    renderSessions(); renderTimerSide();
    if (tab === 'stats') renderStats();
  }

  // ---------- estadísticas ----------
  function buildStatsView() {
    var v = $('view-stats');
    v.innerHTML = '<div class="card"><h3>Resumen</h3><div class="table-wrap" id="st-table"></div></div>' +
      '<div class="card"><h3>Evolución</h3><div class="chart-wrap"><canvas id="chart"></canvas></div></div>' +
      '<div class="card"><h3>¿Dónde pierdes tiempo?</h3><div id="breakdown"></div></div>' +
      '<div class="card"><h3>Resoluciones</h3><div class="table-wrap" id="st-solves"></div></div>' +
      '<div class="card"><h3>Gestión</h3><div class="btn-row">' +
      '<button class="btn" id="m-rename">Renombrar perfil</button><button class="btn danger" id="m-del">Borrar perfil</button>' +
      '<button class="btn" id="m-csv">Exportar CSV</button><button class="btn" id="m-json">Copia de seguridad JSON</button>' +
      '<button class="btn" id="m-imp">Importar JSON</button><input type="file" id="m-file" accept=".json,application/json" hidden></div></div>';
    $('st-solves').addEventListener('click', onSolveAction);
    $('m-rename').onclick = function () {
      Dialog.prompt('Nuevo nombre del perfil', S.activeSession().name).then(function (n) {
        if (n && n.trim()) { S.renameSession(S.activeSession().id, n.trim()); renderAll(); }
      });
    };
    $('m-del').onclick = function () {
      Dialog.confirm('¿Borrar el perfil "' + S.activeSession().name + '" con todas sus resoluciones y su progreso?', { okText: 'Borrar', danger: true }).then(function (ok) {
        if (!ok) return;
        if (timer) timer.reset(false);
        S.deleteSession(S.activeSession().id); renderAll(); newScramble();
      });
    };
    $('m-csv').onclick = exportCsv;
    $('m-json').onclick = function () { saveFile('cubo-trainer-backup.json', S.exportAll(), 'application/json'); };
    $('m-imp').onclick = function () { $('m-file').click(); };
    $('m-file').onchange = function () {
      var f = this.files[0]; this.value = '';
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        Dialog.confirm('Importar reemplazará TODOS tus datos actuales. ¿Continuar?', { okText: 'Importar', danger: true }).then(function (ok) {
          if (!ok) return;
          try { S.importAll(r.result); renderAll(); toast('Datos importados'); }
          catch (e) { toast('No se pudo importar: ' + e.message); }
        });
      };
      r.readAsText(f);
    };
    window.addEventListener('resize', function () { if (tab === 'stats') drawChart(); });
  }
  async function saveFile(name, text, type) {
    var dl = null;
    if (window.claude && typeof window.claude.use === 'function') {
      try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
    }
    if (dl) {
      try { await dl.save({ filename: name, data: text }); }
      catch (e) {
        var c = e && e.code;
        if (c === 'declined') return;
        if (c === 'rate_limited') toast('Ya hay una descarga pendiente');
        else toast('No se pudo guardar: ' + ((e && e.message) || c || 'error'));
      }
      return;
    }
    download(name, text, type);
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type + ';charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportCsv() {
    var ses = S.activeSession(), arr = times(), a5 = St.rollingAverage(arr, 5), a12 = St.rollingAverage(arr, 12);
    function q(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
    function sec(ms) { return ms === null ? '' : ms === Infinity ? 'DNF' : (ms / 1000).toFixed(2); }
    var rows = ['n,tiempo_s,penalizacion,ao5,ao12,mezcla,fecha,splits'];
    ses.solves.forEach(function (s, i) {
      rows.push([i + 1, s.penalty === 'DNF' ? 'DNF' : sec(St.effectiveTime(s)), s.penalty || '', sec(a5[i]), sec(a12[i]),
        q(s.scramble), q(new Date(s.date).toISOString()), q(s.splits ? s.splits.map(function (x) { return (x / 1000).toFixed(2); }).join(' ') : '')].join(','));
    });
    saveFile(ses.name.replace(/[^\w\-]+/g, '_') + '.csv', '﻿' + rows.join('\n'), 'text/csv');
  }

  function renderStats() {
    if (!$('st-table')) return;
    var sv = S.activeSession().solves, arr = times(), o = summary(arr);
    function row(l, c, b) { return '<tr><th>' + l + '</th><td>' + F(c) + '</td><td>' + F(b) + '</td></tr>'; }
    $('st-table').innerHTML = '<table><thead><tr><th></th><th>Actual</th><th>Mejor</th></tr></thead><tbody>' +
      row('Single', o.cur, o.best) + row('ao5', o.ao5, o.bao5) + row('ao12', o.ao12, o.bao12) + row('ao50', o.ao50, o.bao50) +
      row('ao100', o.ao100, o.bao100) + '<tr><th>Media</th><td colspan="2">' + F(o.mean) + '</td></tr>' +
      '<tr><th>Resoluciones</th><td colspan="2">' + o.n + '</td></tr></tbody></table>';
    drawChart();
    var bd = St.phaseBreakdown(sv, 12), bh;
    if (!bd.phases.length) {
      bh = '<p class="muted">Aún no hay datos por fase. Activa el <b>modo Fases</b> en los ajustes del Cronómetro y haz unas cuantas resoluciones para ver aquí en qué parte pierdes más tiempo.</p>';
    } else {
      var maxI = 0; bd.phases.forEach(function (p, i) { if (p.avgMs > bd.phases[maxI].avgMs) maxI = i; });
      bh = '<p class="muted small">Media de tus últimas ' + bd.count + ' resoluciones con fases.</p>' + bd.phases.map(function (p, i) {
        return '<div class="bd-row"><div class="bd-l">' + esc(p.name) + (i === maxI ? ' <span class="chip chip-nuevo">Más lenta</span>' : '') + '</div>' +
          '<div class="bar"><div class="bar-fill' + (i === maxI ? ' slow' : '') + '" style="width:' + p.pct.toFixed(1) + '%"></div></div>' +
          '<div class="bd-v">' + F(p.avgMs) + ' · ' + Math.round(p.pct) + '%</div></div>';
      }).join('');
    }
    $('breakdown').innerHTML = bh;
    var a5 = St.rollingAverage(arr, 5), a12 = St.rollingAverage(arr, 12);
    $('st-solves').innerHTML = sv.length ? '<table class="full"><thead><tr><th>#</th><th>Tiempo</th><th>ao5</th><th>ao12</th><th>Fecha</th><th></th></tr></thead><tbody>' +
      sv.map(function (s, i) { return i; }).reverse().map(function (i) {
        var s = sv[i];
        return '<tr data-id="' + s.id + '"><td>' + (i + 1) + '</td><td><a href="#" data-a="view">' + esc(fmtSolve(s)) + '</a></td><td>' + F(a5[i]) + '</td><td>' + F(a12[i]) +
          '</td><td class="muted small">' + esc(fmtDate(s.date)) + '</td><td>' + actionsHtml(s) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="muted">Sin resoluciones en este perfil.</p>';
  }

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function drawChart() {
    var cv = $('chart'); if (!cv) return;
    var wrap = cv.parentNode, w = wrap.clientWidth || 300, h = Math.max(220, Math.min(340, w * 0.55));
    var dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    var arr = times(), fg = cssVar('--muted'), grid = cssVar('--border'), acc = cssVar('--accent');
    var pad = { l: 44, r: 12, t: 28, b: 24 };
    var cp = PlanView.currentPhase(), goal = cp && cp.goalMs ? cp.goalMs : null;
    var valid = arr.filter(function (v) { return v !== Infinity; });
    c.font = '12px system-ui, sans-serif'; c.fillStyle = fg;
    if (!valid.length) { c.textAlign = 'center'; c.fillText('Sin datos todavía', w / 2, h / 2); return; }
    var a5 = St.rollingAverage(arr, 5), a12 = St.rollingAverage(arr, 12);
    var all = valid.slice();
    var vmax = Math.max.apply(null, valid), vmin = Math.min.apply(null, valid);
    if (goal && goal <= vmax * 2.5 && goal >= vmin / 2.5) all.push(goal); else goal = null;
    var lo = Math.min.apply(null, all) / 1000, hi = Math.max.apply(null, all) / 1000;
    var span = Math.max(hi - lo, 1); lo = Math.max(0, lo - span * 0.08); hi = hi + span * 0.08;
    var n = arr.length, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    function X(i) { return pad.l + (n <= 1 ? pw / 2 : i / (n - 1) * pw); }
    function Y(ms) { return pad.t + (1 - (ms / 1000 - lo) / (hi - lo)) * ph; }
    c.strokeStyle = grid; c.lineWidth = 1; c.textAlign = 'right';
    for (var k = 0; k <= 4; k++) {
      var val = lo + (hi - lo) * k / 4, y = pad.t + (1 - k / 4) * ph;
      c.beginPath(); c.moveTo(pad.l, y); c.lineTo(w - pad.r, y); c.stroke();
      c.fillText(val.toFixed(val >= 100 ? 0 : 1), pad.l - 6, y + 4);
    }
    c.textAlign = 'center';
    var step = Math.max(1, Math.ceil(n / 8));
    for (var i = 0; i < n; i += step) c.fillText(String(i + 1), X(i), h - 6);
    c.save(); c.translate(11, pad.t + ph / 2); c.rotate(-Math.PI / 2); c.fillText('segundos', 0, 0); c.restore();
    function line(data, color) {
      c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); var on = false;
      data.forEach(function (v, i) {
        if (v === null || v === Infinity) { on = false; return; }
        if (!on) { c.moveTo(X(i), Y(v)); on = true; } else c.lineTo(X(i), Y(v));
      });
      c.stroke();
    }
    if (goal) {
      c.setLineDash([6, 4]); c.strokeStyle = cssVar('--good'); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(pad.l, Y(goal)); c.lineTo(w - pad.r, Y(goal)); c.stroke(); c.setLineDash([]);
      c.fillStyle = cssVar('--good'); c.textAlign = 'right';
      c.fillText('Meta: ' + F(goal) + ' (' + cp.title.split('·')[0].trim() + ')', w - pad.r - 2, Y(goal) - 5);
    }
    c.fillStyle = acc; c.globalAlpha = 0.55;
    arr.forEach(function (v, i) { if (v === Infinity) return; c.beginPath(); c.arc(X(i), Y(v), 3, 0, 7); c.fill(); });
    c.globalAlpha = 1;
    line(a5, cssVar('--c5')); line(a12, cssVar('--c12'));
    c.textAlign = 'left'; var lx = pad.l;
    [['Tiempo', acc], ['ao5', cssVar('--c5')], ['ao12', cssVar('--c12')]].forEach(function (l) {
      c.fillStyle = l[1]; c.fillRect(lx, 8, 12, 4); c.fillStyle = fg; c.fillText(l[0], lx + 16, 14); lx += 24 + c.measureText(l[0]).width + 8;
    });
  }

  // ---------- varios ----------
  function toast(msg) { Dialog.toast(msg); }

  function renderAll() {
    renderSessions(); renderTimerSide();
    renderPhases({ state: 'idle', splits: [], ms: 0 });
    var s = S.settings();
    if ($('s-insp')) {
      $('s-insp').checked = s.inspection; $('s-phase').value = s.phaseMode; $('s-custom').value = s.customPhases;
      $('s-hide').checked = s.hideTime; $('s-len').value = s.scrambleLength; $('s-net').checked = s.showNet;
      $('s-custom-wrap').style.display = s.phaseMode === 'custom' ? '' : 'none';
      drawNet();
    }
    if (tab === 'stats') renderStats();
    if (tab === 'plan') PlanView.render();
    Trainer.render();
  }

  function bindSyncStatus() {
    var el = $('sync-status');
    if (!el || !window.Sync) return;
    var txt = { local: 'Guardado en este navegador', connecting: 'Conectando…', synced: 'Sincronizado', saving: 'Guardando…', error: 'Error al guardar' };
    window.Sync.onStatus(function (st, detail) {
      el.className = 'sync-status s-' + st;
      el.querySelector('.txt').textContent = txt[st] || st;
      el.title = st === 'error' ? (detail || '') : '';
      // con la sincronización activa los datos se guardan aunque falle el almacenamiento del navegador
      $('warn').hidden = st === 'synced' || st === 'saving' || S.isPersistent();
    });
  }

  function init() {
    S.get();
    $('warn').hidden = S.isPersistent();
    buildTimerView();
    buildStatsView();
    Trainer.mount($('view-trainer'));
    PlanView.mount($('view-plan'));
    newScramble();
    renderSessions(); renderTimerSide();
    renderPhases({ state: 'idle', splits: [], ms: 0 });
    bindSyncStatus();
    S.onReplace(renderAll);
    $('tabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) showTab(b.dataset.tab); });
    $('session-select').onchange = function () { if (timer) timer.reset(false); S.setActive(this.value); newScramble(); };
    $('new-session').onclick = function () {
      Dialog.prompt('Nombre del nuevo perfil', 'Perfil ' + (S.get().sessions.length + 1)).then(function (n) {
        if (n === null) return;
        if (timer) timer.reset(false);
        S.newSession(n.trim() || undefined); renderAll(); newScramble();
      });
    };
    var redraw = function () { if (tab === 'stats') drawChart(); };
    var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mq && mq.addEventListener) mq.addEventListener('change', redraw);
    if (window.MutationObserver) new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  // Lo usa sync.js para no repintar con datos remotos mientras se cronometra
  window.App = { isBusy: function () { return !!(window.CubeTimer && CubeTimer.anyBusy && CubeTimer.anyBusy()); } };
  init();
})();
