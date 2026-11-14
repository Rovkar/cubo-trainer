(function () {
  'use strict';
  var S = Storage, St = Stats, I = I18N;
  var t = I.t;
  var $ = function (id) { return document.getElementById(id); };
  var esc = escHtml;
  var F = St.formatTime;
  var tab = 'timer';
  var scramble = '';
  var timer = null;
  var els = {};
  var syncState = { st: 'local', detail: '' };

  // Los presets guardan claves canónicas; el nombre mostrado depende del idioma actual
  var PRESETS = {
    beginner: ['cross', 'firstLayer', 'secondLayer', 'lastLayer'],
    cfop: ['cross', 'f2l', 'oll', 'pll']
  };

  function phaseList() {
    var s = S.settings();
    if (s.phaseMode === 'off') return null;
    if (PRESETS[s.phaseMode]) return PRESETS[s.phaseMode].map(function (k) { return t('phase.' + k); });
    var l = (s.customPhases || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    return l.length ? l : null;
  }
  // Atributo data-i18n + texto actual: d('clave') se concatena justo antes de cerrar la etiqueta de apertura
  function d(key) { return 'data-i18n="' + key + '">' + esc(t(key)); }
  function times() { return S.activeSession().solves.map(St.effectiveTime); }
  function fmtSolve(s) {
    var e = St.effectiveTime(s);
    if (s.penalty === 'DNF') return 'DNF(' + F(s.time) + ')';
    return F(e) + (s.penalty === '+2' ? '+' : '');
  }
  function fmtDate(dt) { try { return new Date(dt).toLocaleString(I.locale()); } catch (e) { return ''; } }
  function phaseKeyOrRaw(n) { return I.phaseKey(n) || n; }

  // ---------- red en cruz ----------
  function netSvg(state) {
    var C = Cube.COLORS, pos = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };
    var out = '<svg class="net" viewBox="-1 -1 122 92" role="img" aria-label="' + esc(t('net.aria')) + '">';
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
    b.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="btn small-btn modal-x" aria-label="' + esc(t('common.close')) + '">✕</button>' + html + '</div>';
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
    var h = '<h3>' + esc(t('solve.title', { time: fmtSolve(sv) })) + '</h3><p class="muted">' + esc(fmtDate(sv.date)) + '</p>' +
      '<p class="muted small">' + esc(t('scramble.label')) + '</p><code class="alg">' + esc(sv.scramble) + '</code>';
    if (sv.splits && sv.phases) {
      h += '<p class="muted small">' + esc(t('solve.phaseTimes')) + '</p><ul class="plain">';
      sv.phases.forEach(function (n, i) {
        h += '<li>' + esc(I.phaseName(n)) + ': <b>' + F(sv.splits[i] - (i ? sv.splits[i - 1] : 0)) + '</b> <span class="muted">' + esc(t('solve.cumulative', { time: F(sv.splits[i]) })) + '</span></li>';
      });
      h += '</ul>';
    }
    modal(h);
  }

  // ---------- pestañas ----------
  function showTab(tb) {
    tab = tb;
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tb); });
    ['timer', 'trainer', 'stats', 'plan', 'notation'].forEach(function (v) { $('view-' + v).hidden = v !== tb; });
    Trainer.setActive(tb === 'trainer');
    if (tb === 'stats' || tb === 'plan' || tb === 'notation') ScreenWake.release();
    if (timer && tb !== 'timer') timer.reset(false);
    if (tb === 'stats') renderStats();
    if (tb === 'plan') PlanView.render();
    if (tb === 'notation' && window.NotationView) NotationView.render();
    if (tb === 'timer') renderTimerSide();
    window.scrollTo(0, 0);
  }

  // ---------- perfiles ----------
  function renderSessions() {
    var dt = S.get();
    $('session-select').innerHTML = dt.sessions.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === dt.activeSessionId ? ' selected' : '') + '>' +
        esc(t(s.solves.length === 1 ? 'profile.opt.one' : 'profile.opt.many', { name: s.name, n: s.solves.length })) + '</option>';
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
      '<div class="card scramble-card"><div class="scramble-head"><span class="muted small" ' + d('scramble.label') + '</span>' +
      '<span><button class="btn small-btn" id="b-notation" ' + d('notation.howToRead') + '</button> <button class="btn small-btn" id="b-new" ' + d('scramble.new') + '</button> <button class="btn small-btn" id="b-copy" ' + d('scramble.copy') + '</button></span></div>' +
      '<div id="scramble" class="scramble"></div>' +
      '<div id="net-wrap"><div id="net"></div><div class="muted small" ' + d('net.note') + '</div></div></div>' +
      '<div id="tzone" class="timer-zone" tabindex="-1"><div id="insp-note" class="insp-note"></div><div id="time" class="time">0.00</div>' +
      '<div class="muted small" id="hint" ' + d('timer.hint') + '</div></div>' +
      '<div id="phases" class="phases"></div>' +
      '<details class="card settings" id="settings"><summary ' + d('set.title') + '</summary><div class="settings-grid">' +
      '<label class="check"><input type="checkbox" id="s-insp"> <span ' + d('set.inspection') + '</span></label>' +
      '<label><span ' + d('set.phaseMode') + '</span> <select id="s-phase"><option value="off" ' + d('set.phase.off') + '</option>' +
      '<option value="beginner" ' + d('set.phase.beginner') + '</option>' +
      '<option value="cfop" ' + d('set.phase.cfop') + '</option><option value="custom" ' + d('set.phase.custom') + '</option></select></label>' +
      '<label id="s-custom-wrap"><span ' + d('set.customPhases') + '</span> <input type="text" id="s-custom" placeholder="' + esc(t('set.customPlaceholder')) + '" data-i18n-placeholder="set.customPlaceholder"></label>' +
      '<label class="check"><input type="checkbox" id="s-hide"> <span ' + d('set.hideTime') + '</span></label>' +
      '<label><span ' + d('set.length') + '</span> <input type="number" id="s-len" min="20" max="25" style="width:70px"></label>' +
      '<label class="check"><input type="checkbox" id="s-net"> <span ' + d('set.showNet') + '</span></label>' +
      '</div></details>' +
      '<div class="card"><div id="quick" class="quick"></div></div>' +
      '<div class="card"><h3 ' + d('recent.title') + '</h3><div id="recent"></div></div>';
    var s = S.settings();
    $('s-insp').checked = s.inspection; $('s-phase').value = s.phaseMode; $('s-custom').value = s.customPhases;
    $('s-hide').checked = s.hideTime; $('s-len').value = s.scrambleLength; $('s-net').checked = s.showNet;
    $('s-custom-wrap').style.display = s.phaseMode === 'custom' ? '' : 'none';

    $('b-new').onclick = newScramble;
    $('b-copy').onclick = function () {
      var done = function () { toast(t('toast.copied')); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(scramble).then(done, fallback);
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = scramble; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { toast(t('toast.copyFail')); }
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

  function paintTimer(tm) {
    var z = $('tzone'), disp = $('time'), note = $('insp-note'), hint = $('hint');
    if (!z) return;
    var cls = 'timer-zone st-' + tm.state + (tm.inspecting || tm.inspLeft !== null ? ' insp' : '');
    z.className = cls;
    var txt, n = '';
    if (tm.inspLeft !== null && tm.state !== 'running') {
      var el = tm.inspLeft;
      txt = el < 15000 ? String(Math.ceil((15000 - el) / 1000)) : el < 17000 ? '+2' : 'DNF';
      n = tm.inspWarn ? tm.inspWarn + ' s' : t('timer.inspection');
      if (tm.state === 'holding') n += t('timer.hold');
      if (tm.state === 'ready') n = t('timer.release');
    } else if (tm.state === 'running') {
      txt = S.settings().hideTime ? t('timer.solving') : F(tm.ms);
      var ph = phaseList();
      if (ph) n = t('timer.phaseNote', { name: ph[Math.min(tm.splits.length, ph.length - 1)] });
    } else if (tm.state === 'idle') txt = '0.00';
    else txt = F(tm.ms);
    disp.textContent = txt;
    disp.classList.toggle('small-txt', txt === t('timer.solving'));
    note.textContent = n;
    hint.style.visibility = tm.state === 'idle' ? 'visible' : 'hidden';
    renderPhases(tm);
  }

  function renderPhases(tm) {
    var ph = phaseList(), box = $('phases');
    if (!box) return;
    if (!ph) { box.innerHTML = ''; return; }
    var h = '<ul class="phase-list">';
    ph.forEach(function (n, i) {
      var v = '–', cls = '';
      if (i < tm.splits.length) v = F(tm.splits[i] - (i ? tm.splits[i - 1] : 0));
      else if (i === tm.splits.length && tm.state === 'running') {
        v = S.settings().hideTime ? '…' : F(tm.ms - (i ? tm.splits[i - 1] : 0)); cls = ' cur';
      }
      h += '<li class="' + cls + '"><span>' + esc(I.phaseName(n)) + '</span><b>' + v + '</b></li>';
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
    function q(l, c, b) { return '<div class="q"><div class="q-l">' + l + '</div><div class="q-v">' + F(c) + '</div><div class="muted small">' + esc(t('quick.best', { time: F(b) })) + '</div></div>'; }
    $('quick').innerHTML = q(esc(t('stat.single')), o.cur, o.best) + q('ao5', o.ao5, o.bao5) + q('ao12', o.ao12, o.bao12) +
      '<div class="q"><div class="q-l">' + esc(t('stat.mean')) + '</div><div class="q-v">' + F(o.mean) + '</div><div class="muted small">' +
      esc(t(o.n === 1 ? 'stat.count.one' : 'stat.count.many', { n: o.n })) + '</div></div>';
    var sv = S.activeSession().solves, last = sv.slice(-10).reverse();
    $('recent').innerHTML = last.length ? '<ul class="solves">' + last.map(function (s, i) {
      return '<li data-id="' + s.id + '"><span class="muted n">' + (sv.length - i) + '</span>' +
        '<a href="#" class="stime" data-a="view">' + esc(fmtSolve(s)) + '</a>' + actionsHtml(s) + '</li>';
    }).join('') + '</ul>' : '<p class="muted">' + esc(t('recent.empty')) + '</p>';
  }
  function actionsHtml(s) {
    return '<span class="acts"><button class="btn tiny' + (!s.penalty ? ' on' : '') + '" data-a="ok">OK</button>' +
      '<button class="btn tiny' + (s.penalty === '+2' ? ' on' : '') + '" data-a="p2">+2</button>' +
      '<button class="btn tiny' + (s.penalty === 'DNF' ? ' on' : '') + '" data-a="dnf">DNF</button>' +
      '<button class="btn tiny danger" data-a="del" aria-label="' + esc(t('solve.delete.aria')) + '">🗑</button></span>';
  }
  function onSolveAction(e) {
    var tg = e.target.closest('[data-a]'), li = e.target.closest('[data-id]');
    if (!tg || !li) return;
    e.preventDefault();
    var id = li.dataset.id, a = tg.dataset.a;
    if (a === 'view') return solveModal(id);
    if (a === 'ok') S.setPenalty(id, null);
    else if (a === 'p2') S.setPenalty(id, '+2');
    else if (a === 'dnf') S.setPenalty(id, 'DNF');
    else if (a === 'del') {
      Dialog.confirm(t('solve.delete.confirm'), { okText: t('common.delete'), danger: true }).then(function (ok) {
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
    v.innerHTML = '<div class="card"><h3 ' + d('stats.summary') + '</h3><div class="table-wrap" id="st-table"></div></div>' +
      '<div class="card"><h3 ' + d('stats.progress') + '</h3><div class="chart-wrap"><canvas id="chart"></canvas></div></div>' +
      '<div class="card"><h3 ' + d('stats.breakdown') + '</h3><div id="breakdown"></div></div>' +
      '<div class="card"><h3 ' + d('stats.solves') + '</h3><div class="table-wrap" id="st-solves"></div></div>' +
      '<div class="card"><h3 ' + d('stats.manage') + '</h3><div class="btn-row">' +
      '<button class="btn" id="m-rename" ' + d('manage.rename') + '</button><button class="btn danger" id="m-del" ' + d('manage.delete') + '</button>' +
      '<button class="btn" id="m-csv" ' + d('manage.csv') + '</button><button class="btn" id="m-json" ' + d('manage.json') + '</button>' +
      '<button class="btn" id="m-imp" ' + d('manage.import') + '</button><input type="file" id="m-file" accept=".json,application/json" hidden></div></div>';
    $('st-solves').addEventListener('click', onSolveAction);
    $('m-rename').onclick = renameActive;
    $('m-del').onclick = function () {
      Dialog.confirm(t('manage.deleteConfirm', { name: S.activeSession().name }), { okText: t('common.delete'), danger: true }).then(function (ok) {
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
        Dialog.confirm(t('manage.importConfirm'), { okText: t('common.import'), danger: true }).then(function (ok) {
          if (!ok) return;
          try { S.importAll(r.result); renderAll(); toast(t('manage.imported')); }
          catch (e) { toast(t('manage.importFail', { msg: e.message })); }
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
        if (c === 'rate_limited') toast(t('save.pending'));
        else toast(t('save.fail', { msg: (e && e.message) || c || t('save.errorWord') }));
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
  // Cabecera fija en inglés (no se traduce): el CSV tiene las mismas columnas en cualquier idioma.
  var CSV_HEADER = 'n,time_s,penalty,ao5,ao12,scramble,date,splits';
  function exportCsv() {
    var ses = S.activeSession(), arr = times(), a5 = St.rollingAverage(arr, 5), a12 = St.rollingAverage(arr, 12);
    function q(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
    function sec(ms) { return ms === null ? '' : ms === Infinity ? 'DNF' : (ms / 1000).toFixed(2); }
    var rows = [CSV_HEADER];
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
    $('st-table').innerHTML = '<table><thead><tr><th></th><th>' + esc(t('stats.current')) + '</th><th>' + esc(t('stats.best')) + '</th></tr></thead><tbody>' +
      row(esc(t('stat.single')), o.cur, o.best) + row('ao5', o.ao5, o.bao5) + row('ao12', o.ao12, o.bao12) + row('ao50', o.ao50, o.bao50) +
      row('ao100', o.ao100, o.bao100) + '<tr><th>' + esc(t('stat.mean')) + '</th><td colspan="2">' + F(o.mean) + '</td></tr>' +
      '<tr><th>' + esc(t('stats.solves')) + '</th><td colspan="2">' + o.n + '</td></tr></tbody></table>';
    drawChart();
    var bd = St.phaseBreakdown(sv, 12, phaseKeyOrRaw), bh;
    if (!bd.phases.length) {
      bh = '<p class="muted">' + t('stats.noPhaseData') + '</p>';
    } else {
      var maxI = 0; bd.phases.forEach(function (p, i) { if (p.avgMs > bd.phases[maxI].avgMs) maxI = i; });
      bh = '<p class="muted small">' + esc(t('stats.phaseAvg', { n: bd.count })) + '</p>' + bd.phases.map(function (p, i) {
        return '<div class="bd-row"><div class="bd-l">' + esc(I.phaseName(p.name)) + (i === maxI ? ' <span class="chip chip-nuevo">' + esc(t('stats.slowest')) + '</span>' : '') + '</div>' +
          '<div class="bar"><div class="bar-fill' + (i === maxI ? ' slow' : '') + '" style="width:' + p.pct.toFixed(1) + '%"></div></div>' +
          '<div class="bd-v">' + F(p.avgMs) + ' · ' + Math.round(p.pct) + '%</div></div>';
      }).join('');
    }
    $('breakdown').innerHTML = bh;
    var a5 = St.rollingAverage(arr, 5), a12 = St.rollingAverage(arr, 12);
    $('st-solves').innerHTML = sv.length ? '<table class="full"><thead><tr><th>#</th><th>' + esc(t('stats.time')) + '</th><th>ao5</th><th>ao12</th><th>' + esc(t('stats.date')) + '</th><th></th></tr></thead><tbody>' +
      sv.map(function (s, i) { return i; }).reverse().map(function (i) {
        var s = sv[i];
        return '<tr data-id="' + s.id + '"><td>' + (i + 1) + '</td><td><a href="#" data-a="view">' + esc(fmtSolve(s)) + '</a></td><td>' + F(a5[i]) + '</td><td>' + F(a12[i]) +
          '</td><td class="muted small">' + esc(fmtDate(s.date)) + '</td><td>' + actionsHtml(s) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="muted">' + esc(t('stats.noSolves')) + '</p>';
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
    if (!valid.length) { c.textAlign = 'center'; c.fillText(t('chart.none'), w / 2, h / 2); return; }
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
    c.save(); c.translate(11, pad.t + ph / 2); c.rotate(-Math.PI / 2); c.fillText(t('chart.seconds'), 0, 0); c.restore();
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
      c.fillText(t('chart.goal', { time: F(goal), title: cp.title.split('·')[0].trim() }), w - pad.r - 2, Y(goal) - 5);
    }
    c.fillStyle = acc; c.globalAlpha = 0.55;
    arr.forEach(function (v, i) { if (v === Infinity) return; c.beginPath(); c.arc(X(i), Y(v), 3, 0, 7); c.fill(); });
    c.globalAlpha = 1;
    line(a5, cssVar('--c5')); line(a12, cssVar('--c12'));
    c.textAlign = 'left'; var lx = pad.l;
    [[t('chart.time'), acc], ['ao5', cssVar('--c5')], ['ao12', cssVar('--c12')]].forEach(function (l) {
      c.fillStyle = l[1]; c.fillRect(lx, 8, 12, 4); c.fillStyle = fg; c.fillText(l[0], lx + 16, 14); lx += 24 + c.measureText(l[0]).width + 8;
    });
  }

  // ---------- varios ----------
  function toast(msg) { Dialog.toast(msg); }

  // Renombra el perfil activo (cabecera y Estadísticas > Gestionar): recorta, ignora vacío, máx. 40 caracteres
  function renameActive() {
    var cur = S.activeSession(), id = cur.id;
    return Dialog.prompt(t('manage.renamePrompt', { name: cur.name }), cur.name).then(function (n) {
      if (n === null || !S.renameSession(id, n)) return false;
      renderSessions(); toast(t('profile.renamed')); // solo cambia el selector: no repinta el cronómetro (puede estar en marcha)
      return true;
    });
  }

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

  // ---------- estado de sincronización y aviso ----------
  function paintSync() {
    var el = $('sync-status');
    if (!el) return;
    var key = 'sync.' + syncState.st, txt = t(key);
    el.className = 'sync-status s-' + syncState.st;
    el.querySelector('.txt').textContent = txt === key ? syncState.st : txt;
    el.title = syncState.st === 'error' ? (syncState.detail || '') : '';
  }
  function updateWarn() {
    // con la sincronización activa los datos se guardan aunque falle el almacenamiento del navegador
    $('warn').hidden = syncState.st === 'synced' || syncState.st === 'saving' || S.isPersistent();
  }
  function bindSyncStatus() {
    if (!$('sync-status') || !window.Sync) return;
    window.Sync.onStatus(function (st, detail) {
      syncState = { st: st, detail: detail };
      paintSync();
      updateWarn();
    });
  }

  // ---------- idioma ----------
  function updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.lang === I.lang ? 'true' : 'false');
    });
  }
  // Solo repinta: nunca reconstruye las vistas ni vuelve a montar (crearía un segundo CubeTimer)
  function onLangChange() {
    I.apply(document);
    updateLangButtons();
    paintSync(); updateWarn();
    renderAll();
    if (tab !== 'plan') PlanView.render();
    if (window.NotationView) NotationView.render();
    if (timer) timer.emit(); // reescribe textos del cronómetro y de la lista de fases según el estado real
    if (tab === 'stats') drawChart();
  }

  function init() {
    S.get();
    I.apply(document);
    updateLangButtons();
    updateWarn();
    buildTimerView();
    buildStatsView();
    Trainer.mount($('view-trainer'));
    PlanView.mount($('view-plan'));
    if (window.NotationView) NotationView.mount($('view-notation'));
    $('b-notation').onclick = function () { showTab('notation'); };
    newScramble();
    renderSessions(); renderTimerSide();
    renderPhases({ state: 'idle', splits: [], ms: 0 });
    paintSync();
    bindSyncStatus();
    S.onReplace(renderAll);
    I.onChange(onLangChange);
    $('lang-switch').addEventListener('click', function (e) {
      var b = e.target.closest('.lang-btn');
      if (b) I.setLang(b.dataset.lang);
    });
    $('tabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) showTab(b.dataset.tab); });
    $('session-select').onchange = function () { if (timer) timer.reset(false); S.setActive(this.value); newScramble(); };
    $('rename-session').onclick = renameActive;
    $('new-session').onclick = function () {
      Dialog.prompt(t('profile.newPrompt'), t('profile.default', { n: S.get().sessions.length + 1 })).then(function (n) {
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
  window.App = { showTab: showTab, isBusy: function () { return !!(window.CubeTimer && CubeTimer.anyBusy && CubeTimer.anyBusy()); } };
  init();
})();
