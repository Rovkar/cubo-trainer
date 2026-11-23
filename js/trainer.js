(function (root) {
  'use strict';
  var SET_ORDER = ['EO', 'OCLL', 'CP', 'EP'];
  var SET_ORDER4 = ['EO', 'OCLL', 'CP', 'EP', 'OLLP', 'PLLP']; // the 4x4 Trainer adds the two parity sets
  var STATUSES = ['nuevo', 'aprendiendo', 'dominado']; // valores guardados; la etiqueta se traduce con la clave status + valor
  var mode = 'learn';
  var container = null;
  var active = false;
  var timer = null;
  var filt = { sets: { EO: true, OCLL: true, CP: true, EP: true, OLLP: true, PLLP: true }, only: 'todos' };
  var cur = null; // { c, setup, revealed }
  var lastId = null;
  var timeEl = null;

  // ---- 3x3 / 4x4 mode (device preference, js/puzzle.js). The 4x4 case list lives in js/trainer4.js ----
  function is4() { return !!(root.Puzzle && root.Puzzle.is4() && root.Trainer4); }
  function cases() { return is4() ? root.Trainer4.CASES : root.ALGS; }
  function setOrder() { return is4() ? SET_ORDER4 : SET_ORDER; }
  function isPractice(c) { return c.practice !== false; } // 3x3 cases have no flag: all of them can be practiced
  function setOn(s) { return filt.sets[s] !== false; }

  function esc(s) { return root.escHtml(s); }
  function t(key, params) { return root.I18N.t(key, params); }
  function F(ms) { return root.Stats.formatTime(ms); }

  function diagram(view) {
    var C = root.Cube.COLORS;
    var cell = 20, gap = 2, m = 18, th = 8;
    var out = '<svg class="ll" viewBox="0 0 100 100" role="img" aria-label="' + esc(t('trainer.diagram.aria')) + '">';
    function rect(x, y, w, h, v) {
      var fill = (!v || v === 'x') ? 'var(--hidden)' : C[v];
      out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="' + fill + '" stroke="var(--stk)" stroke-width="0.8"/>';
    }
    for (var i = 0; i < 9; i++) rect(m + (i % 3) * (cell + gap), m + Math.floor(i / 3) * (cell + gap), cell, cell, view.u[i]);
    for (var k = 0; k < 3; k++) {
      var p = m + k * (cell + gap);
      rect(p, 6, cell, th, view.b[k]);
      rect(86, p, th, cell, view.r[k]);
      rect(p, 86, cell, th, view.f[k]);
      rect(6, p, th, cell, view.l[k]);
    }
    return out + '</svg>';
  }

  function chip(st) {
    return '<span class="chip chip-' + st + '">' + esc(t('status.' + st)) + '</span>';
  }

  function avgOf(id) {
    var t = root.Storage.caseTimes(id);
    if (!t.length) return null;
    var last = t.slice(-5);
    return last.reduce(function (a, b) { return a + b; }, 0) / last.length;
  }

  // diagram of a case in the current mode (3x3 or 4x4 top view)
  function caseDiagram(c) {
    return is4() ? root.Trainer4.svg(root.Trainer4.viewOf(c)) : diagram(root.Cube.caseStickers(c.alg, c.mask));
  }

  function learnBody(c) {
    var h = '';
    if (c.alg) h += '<code class="alg">' + esc(c.alg) + '</code>';
    else {
      // Learn-only 4x4 card: summary of a recipe with several steps, plus the algorithms it uses
      h += '<p class="tip"><b>' + esc(t('t4.lbl.steps')) + '</b> ' + esc(c.summary || '') + '</p>';
      (c.shows || []).forEach(function (x) {
        h += '<div class="muted small">' + esc(t(x.key)) + '</div><code class="alg">' + esc(x.alg) + '</code>';
      });
    }
    h += '<p class="tip">' + esc(c.tip || '') + '</p>';
    if (c.hold) h += '<p class="tip"><b>' + esc(t('t4.hold.label')) + '</b> ' + esc(c.hold) + '</p>';
    if (c.note) h += '<p class="tip">' + esc(c.note) + '</p>';
    if (!c.alg) {
      h += '<p class="muted small">' + esc(t('t4.learnOnly.note')) + '</p>' +
        '<div><button class="btn small-btn" data-act="notation" data-target="' + esc((root.Trainer4 && root.Trainer4.notationCase(c.id)) || '') + '">' +
        esc(t('t4.openNotation')) + '</button></div>';
    }
    return h;
  }

  function renderLearn() {
    var list = cases();
    var total = list.length, mastered = list.filter(function (c) { return root.Storage.caseStatus(c.id) === 'dominado'; }).length;
    var h = '<div class="muted counter">' + t('trainer.mastered', { m: mastered, total: total, name: esc(root.Storage.activeSession().name) }) + '</div>';
    setOrder().forEach(function (s) {
      var cs = list.filter(function (c) { return c.set === s; });
      if (!cs.length) return;
      h += '<h3 class="set-title">' + esc(cs[0].setName) + '</h3><div class="cards">';
      cs.forEach(function (c) {
        var st = root.Storage.caseStatus(c.id), times = root.Storage.caseTimes(c.id);
        h += '<article class="card case" data-id="' + esc(c.id) + '">' +
          caseDiagram(c) +
          '<div class="case-body"><div class="case-name">' + esc(c.name) + ' ' + chip(st) +
          (isPractice(c) ? '' : ' <span class="muted small">' + esc(t('t4.learnOnly')) + '</span>') + '</div>' +
          learnBody(c) +
          '<select class="st-select" aria-label="' + esc(t('trainer.statusOf', { name: c.name })) + '">' +
          STATUSES.map(function (x) { return '<option value="' + x + '"' + (x === st ? ' selected' : '') + '>' + esc(t('status.' + x)) + '</option>'; }).join('') +
          '</select>' +
          (times.length ? '<div class="muted small">' + t(times.length === 1 ? 'trainer.avg.one' : 'trainer.avg.many', { avg: F(avgOf(c.id)), n: times.length }) + '</div>' : '') +
          '</div></article>';
      });
      h += '</div>';
    });
    // 3x3 mode only: the card that switches the whole app to 4x4
    if (!is4()) {
      h += '<section class="card n4-link"><h3>' + esc(t('t4.switch.title')) + '</h3><p class="muted">' + esc(t('t4.switch.text')) + '</p>' +
        '<button class="btn" data-act="n4">' + esc(t('t4.switch.btn')) + '</button></section>';
    }
    return h;
  }

  function pool() {
    return cases().filter(function (c) {
      if (!isPractice(c)) return false;
      if (!setOn(c.set)) return false;
      if (filt.only === 'nodom' && root.Storage.caseStatus(c.id) === 'dominado') return false;
      return true;
    });
  }

  function pickCase() {
    var p = pool();
    if (!p.length) return null;
    if (p.length > 1) p = p.filter(function (c) { return c.id !== lastId; });
    var avgs = p.map(function (c) { return avgOf(c.id); }).filter(function (v) { return v !== null; });
    var gAvg = avgs.length ? avgs.reduce(function (a, b) { return a + b; }, 0) / avgs.length : 0;
    var weights = p.map(function (c) {
      var st = root.Storage.caseStatus(c.id);
      var w = st === 'aprendiendo' ? 3 : st === 'nuevo' ? 2 : 1;
      var a = avgOf(c.id);
      if (a !== null && gAvg > 0) w *= Math.min(3, Math.max(0.5, a / gAvg));
      return w;
    });
    var sum = weights.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * sum;
    for (var i = 0; i < p.length; i++) { r -= weights[i]; if (r <= 0) return p[i]; }
    return p[p.length - 1];
  }

  function nextCase() {
    var c = pickCase();
    if (!c) { cur = null; return; }
    lastId = c.id;
    var setup = is4() ? root.Trainer4.setupFor(c) : root.Cube.setupFor(c.alg);
    cur = { c: c, setup: setup, revealed: false };
    if (timer) timer.reset(false);
  }

  function renderPractice() {
    var h = '<div class="card filters"><div class="filter-row"><b>' + esc(t('trainer.sets')) + '</b> ';
    setOrder().forEach(function (s) {
      var any = cases().filter(function (c) { return c.set === s && isPractice(c); })[0];
      if (!any) return;
      h += '<label class="check"><input type="checkbox" data-set="' + s + '"' + (setOn(s) ? ' checked' : '') + '> ' + esc(any.setName) + '</label>';
    });
    h += '</div><div class="filter-row"><b>' + esc(t('trainer.state')) + '</b> ' +
      '<label class="check"><input type="radio" name="only" value="todos"' + (filt.only === 'todos' ? ' checked' : '') + '> ' + esc(t('trainer.all')) + '</label>' +
      '<label class="check"><input type="radio" name="only" value="nodom"' + (filt.only === 'nodom' ? ' checked' : '') + '> ' + esc(t('trainer.notMastered')) + '</label></div></div>';
    if (!cur) {
      return h + '<div class="card empty">' + esc(t('trainer.noCases')) + '</div>';
    }
    var c = cur.c;
    var E = is4() ? root.Cube4 : root.Cube;
    var view = E.lastLayerView(E.applyAlg(E.solved('yellowTop'), cur.setup), c.mask);
    h += '<div class="card practice"><div class="practice-top">' + (is4() ? root.Trainer4.svg(view) : diagram(view)) + '<div class="practice-info">' +
      '<div class="muted small">' + esc(t('trainer.setup')) + ' <button class="btn small-btn" data-act="notation">' + esc(t('notation.howToRead')) + '</button></div><code class="alg">' + esc(cur.setup) + '</code>' +
      '<div id="solution" class="solution' + (cur.revealed ? '' : ' hidden') + '">' +
      '<div class="case-name">' + esc(c.name) + ' ' + chip(root.Storage.caseStatus(c.id)) + '</div><code class="alg">' + esc(c.alg) + '</code>' +
      '<p class="tip">' + esc(c.tip || '') + '</p>' +
      (c.hold ? '<p class="tip"><b>' + esc(t('t4.hold.label')) + '</b> ' + esc(c.hold) + '</p>' : '') +
      (c.note ? '<p class="tip">' + esc(c.note) + '</p>' : '') + '</div>' +
      '<div class="btn-row"><button class="btn" data-act="reveal"' + (cur.revealed ? ' style="display:none"' : '') + '>' + esc(t('trainer.reveal')) + '</button>' +
      '<button class="btn primary" data-act="next">' + esc(t('trainer.next')) + '</button></div></div></div>' +
      '<div id="ptimer" class="timer-zone small-zone" tabindex="-1"><div id="ptime" class="time">0.00</div>' +
      '<div class="muted small" id="phint">' + esc(t('trainer.hint')) + '</div></div></div>';
    return h;
  }

  function render() {
    if (!container) return;
    var h = '<div class="seg" role="tablist"><button class="seg-btn' + (mode === 'learn' ? ' on' : '') + '" data-mode="learn">' + esc(t('trainer.learn')) + '</button>' +
      '<button class="seg-btn' + (mode === 'practice' ? ' on' : '') + '" data-mode="practice">' + esc(t('trainer.practice')) + '</button></div>';
    h += mode === 'learn' ? renderLearn() : renderPractice();
    container.innerHTML = h;
    if (mode === 'practice' && cur) bindTimer();
  }

  function bindTimer() {
    var zone = container.querySelector('#ptimer');
    timeEl = container.querySelector('#ptime');
    timer.opts.el = null;
    // reengancha eventos de puntero en el nuevo elemento
    zone.addEventListener('pointerdown', function (e) { e.preventDefault(); timer.press(); });
    zone.addEventListener('pointerup', function (e) { e.preventDefault(); timer.release(); });
    zone.addEventListener('pointercancel', function () { timer.release(); });
    if (timer.state === 'stopped' && timer.result) paintTimer({ state: 'stopped', ms: timer.result.time });
  }

  function paintTimer(t) {
    if (!timeEl || !timeEl.isConnected) return;
    timeEl.textContent = F(t.state === 'idle' ? 0 : t.ms);
    var zone = timeEl.parentNode;
    zone.className = 'timer-zone small-zone st-' + t.state;
  }

  function onFinish(r) {
    if (!cur) return;
    root.Storage.addCaseTime(cur.c.id, r.time);
    cur.revealed = true;
    var sol = container.querySelector('#solution');
    if (sol) sol.classList.remove('hidden');
    var rb = container.querySelector('[data-act="reveal"]');
    if (rb) rb.style.display = 'none';
  }

  function goNext() {
    nextCase();
    render();
  }

  function mount(el) {
    container = el;
    timer = new root.CubeTimer({
      el: null,
      isActive: function () { return active && mode === 'practice' && !!cur; },
      getOptions: function () { return { inspection: false, phases: null }; },
      onUpdate: paintTimer,
      onFinish: onFinish,
      onStoppedPress: function () { goNext(); return true; }
    });
    el.addEventListener('change', function (e) {
      var t = e.target;
      if (t.classList.contains('st-select')) {
        root.Storage.setCaseStatus(t.closest('.case').dataset.id, t.value);
        var y = window.scrollY; render(); window.scrollTo(0, y);
      } else if (t.dataset.set) {
        filt.sets[t.dataset.set] = t.checked; goNext();
      } else if (t.name === 'only') {
        filt.only = t.value; goNext();
      }
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.mode) {
        mode = b.dataset.mode;
        if (mode === 'practice' && !cur) nextCase();
        render();
      } else if (b.dataset.act === 'notation') {
        if (root.App && root.App.showTab) root.App.showTab('notation');
        // Learn-only 4x4 cards: jump straight to the card with the full steps instead of the top of the tab
        var target = b.dataset.target && root.document.querySelector('#view-notation [data-case="' + b.dataset.target + '"]');
        if (target && target.scrollIntoView) target.scrollIntoView();
      }
      else if (b.dataset.act === 'n4') {
        // switch the whole app to 4x4 (the header switch does the same); onPuzzleChange re-renders this tab
        if (root.Puzzle) root.Puzzle.set('4x4');
      }
      else if (b.dataset.act === 'next') goNext();
      else if (b.dataset.act === 'reveal' && cur) {
        cur.revealed = true;
        container.querySelector('#solution').classList.remove('hidden');
        b.style.display = 'none';
      }
    });
    render();
  }

  // The puzzle mode changed (3x3 <-> 4x4): drop the current practice case and the timer, and show the other case list.
  function onPuzzleChange() {
    cur = null; lastId = null;
    if (timer) timer.reset(false);
    if (mode === 'practice') nextCase();
    render();
  }

  root.Trainer = {
    mount: mount, render: render, diagram: diagram, onPuzzleChange: onPuzzleChange,
    setActive: function (v) {
      active = v;
      if (v && mode === 'practice' && !cur) nextCase();
      if (v) render();
      else if (timer) timer.reset(false);
    }
  };
})(window);
