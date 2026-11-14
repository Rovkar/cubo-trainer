(function (root) {
  'use strict';
  var SET_ORDER = ['EO', 'OCLL', 'CP', 'EP'];
  var STATUSES = ['nuevo', 'aprendiendo', 'dominado']; // valores guardados; la etiqueta se traduce con la clave status + valor
  var mode = 'learn';
  var container = null;
  var active = false;
  var timer = null;
  var filt = { sets: { EO: true, OCLL: true, CP: true, EP: true }, only: 'todos' };
  var cur = null; // { c, setup, revealed }
  var lastId = null;
  var timeEl = null;

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

  function renderLearn() {
    var total = root.ALGS.length, mastered = root.ALGS.filter(function (c) { return root.Storage.caseStatus(c.id) === 'dominado'; }).length;
    var h = '<div class="muted counter">' + t('trainer.mastered', { m: mastered, total: total, name: esc(root.Storage.activeSession().name) }) + '</div>';
    SET_ORDER.forEach(function (s) {
      var cs = root.ALGS.filter(function (c) { return c.set === s; });
      if (!cs.length) return;
      h += '<h3 class="set-title">' + esc(cs[0].setName) + '</h3><div class="cards">';
      cs.forEach(function (c) {
        var st = root.Storage.caseStatus(c.id), times = root.Storage.caseTimes(c.id);
        h += '<article class="card case" data-id="' + esc(c.id) + '">' +
          diagram(root.Cube.caseStickers(c.alg, c.mask)) +
          '<div class="case-body"><div class="case-name">' + esc(c.name) + ' ' + chip(st) + '</div>' +
          '<code class="alg">' + esc(c.alg) + '</code>' +
          '<p class="tip">' + esc(c.tip || '') + '</p>' +
          '<select class="st-select" aria-label="' + esc(t('trainer.statusOf', { name: c.name })) + '">' +
          STATUSES.map(function (x) { return '<option value="' + x + '"' + (x === st ? ' selected' : '') + '>' + esc(t('status.' + x)) + '</option>'; }).join('') +
          '</select>' +
          (times.length ? '<div class="muted small">' + t(times.length === 1 ? 'trainer.avg.one' : 'trainer.avg.many', { avg: F(avgOf(c.id)), n: times.length }) + '</div>' : '') +
          '</div></article>';
      });
      h += '</div>';
    });
    return h;
  }

  function pool() {
    return root.ALGS.filter(function (c) {
      if (!filt.sets[c.set]) return false;
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
    var setup = root.Cube.setupFor(c.alg);
    cur = { c: c, setup: setup, revealed: false };
    if (timer) timer.reset(false);
  }

  function renderPractice() {
    var h = '<div class="card filters"><div class="filter-row"><b>' + esc(t('trainer.sets')) + '</b> ';
    SET_ORDER.forEach(function (s) {
      var any = root.ALGS.filter(function (c) { return c.set === s; })[0];
      if (!any) return;
      h += '<label class="check"><input type="checkbox" data-set="' + s + '"' + (filt.sets[s] ? ' checked' : '') + '> ' + esc(any.setName) + '</label>';
    });
    h += '</div><div class="filter-row"><b>' + esc(t('trainer.state')) + '</b> ' +
      '<label class="check"><input type="radio" name="only" value="todos"' + (filt.only === 'todos' ? ' checked' : '') + '> ' + esc(t('trainer.all')) + '</label>' +
      '<label class="check"><input type="radio" name="only" value="nodom"' + (filt.only === 'nodom' ? ' checked' : '') + '> ' + esc(t('trainer.notMastered')) + '</label></div></div>';
    if (!cur) {
      return h + '<div class="card empty">' + esc(t('trainer.noCases')) + '</div>';
    }
    var c = cur.c;
    var view = root.Cube.lastLayerView(root.Cube.applyAlg(root.Cube.solved('yellowTop'), cur.setup), c.mask);
    h += '<div class="card practice"><div class="practice-top">' + diagram(view) + '<div class="practice-info">' +
      '<div class="muted small">' + esc(t('trainer.setup')) + ' <button class="btn small-btn" data-act="notation">' + esc(t('notation.howToRead')) + '</button></div><code class="alg">' + esc(cur.setup) + '</code>' +
      '<div id="solution" class="solution' + (cur.revealed ? '' : ' hidden') + '">' +
      '<div class="case-name">' + esc(c.name) + ' ' + chip(root.Storage.caseStatus(c.id)) + '</div><code class="alg">' + esc(c.alg) + '</code>' +
      '<p class="tip">' + esc(c.tip || '') + '</p></div>' +
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
      } else if (b.dataset.act === 'notation') { if (root.App && root.App.showTab) root.App.showTab('notation'); }
      else if (b.dataset.act === 'next') goNext();
      else if (b.dataset.act === 'reveal' && cur) {
        cur.revealed = true;
        container.querySelector('#solution').classList.remove('hidden');
        b.style.display = 'none';
      }
    });
    render();
  }

  root.Trainer = {
    mount: mount, render: render, diagram: diagram,
    setActive: function (v) {
      active = v;
      if (v && mode === 'practice' && !cur) nextCase();
      if (v) render();
      else if (timer) timer.reset(false);
    }
  };
})(window);
