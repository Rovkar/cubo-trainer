(function (root) {
  'use strict';
  var HOLD_MS = 300;
  var instances = [];

  function modalOpen() { return !!document.querySelector('.modal-backdrop'); }
  function typing(e) {
    var t = e.target, tag = t && t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable);
  }

  // Pantalla encendida mientras se inspecciona o resuelve (silencioso si no hay soporte)
  var ScreenWake = (function () {
    var sentinel = null, wanted = false;
    function req() {
      if (!wanted || sentinel || !navigator.wakeLock || !navigator.wakeLock.request) return;
      try {
        navigator.wakeLock.request('screen').then(function (l) {
          if (!wanted) { try { l.release(); } catch (e) { /* ignorar */ } return; }
          sentinel = l;
          if (l.addEventListener) l.addEventListener('release', function () { if (sentinel === l) sentinel = null; });
        }, function () {});
      } catch (e) { /* ignorar */ }
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') req(); });
    return {
      acquire: function () { wanted = true; req(); },
      release: function () {
        wanted = false;
        var l = sentinel; sentinel = null;
        if (l && l.release) { try { l.release().catch(function () {}); } catch (e) { /* ignorar */ } }
      }
    };
  })();
  root.ScreenWake = ScreenWake;

  // opts: { el, isActive(), getOptions() -> {inspection, phases:[names]|null}, onUpdate(t), onFinish(r), onStoppedPress() }
  function CubeTimer(opts) {
    var self = this;
    this.opts = opts;
    this.state = 'idle';
    this.inspecting = false;
    this.inspStart = 0;
    this.startT = 0;
    this.splits = [];
    this.holdTimer = null;
    this.raf = null;
    this.ignoreUp = false;
    this.result = null;
    this.pressing = false;
    instances.push(this);

    var el = opts.el;
    if (el) {
      el.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest('button, a, input, select, label')) return;
        e.preventDefault();
        self.press();
      });
      el.addEventListener('pointerup', function (e) { e.preventDefault(); self.release(); });
      el.addEventListener('pointercancel', function () { self.release(); });
    }
  }

  CubeTimer.prototype.options = function () {
    var o = this.opts.getOptions ? this.opts.getOptions() : {};
    return { inspection: !!o.inspection, phases: o.phases && o.phases.length ? o.phases : null };
  };

  CubeTimer.prototype.emit = function () {
    if (!this.opts.onUpdate) return;
    var now = performance.now();
    var t = { state: this.state, inspecting: this.inspecting, splits: this.splits.slice(), ms: 0, inspLeft: null, inspWarn: null, nextPhase: this.splits.length };
    if (this.state === 'running') t.ms = now - this.startT;
    else if (this.state === 'stopped' && this.result) t.ms = this.result.time;
    if (this.inspecting || (this.state === 'holding' && this.inspStart) || (this.state === 'ready' && this.inspStart)) {
      var el = now - this.inspStart;
      t.inspLeft = el;
      t.inspWarn = el >= 12000 ? 12 : el >= 8000 ? 8 : null;
    }
    this.opts.onUpdate(t);
  };

  CubeTimer.prototype.loop = function () {
    var self = this;
    cancelAnimationFrame(this.raf);
    var f = function () {
      self.emit();
      if (self.state === 'running' || self.inspecting) self.raf = requestAnimationFrame(f);
    };
    f();
  };

  CubeTimer.prototype.setState = function (s) { this.state = s; this.loop(); };

  CubeTimer.prototype.press = function () {
    var st = this.state;
    if (st === 'running') {
      this.ignoreUp = true;
      var now = performance.now();
      var ph = this.options().phases;
      this.splits.push(Math.round(now - this.startT));
      if (!ph || this.splits.length >= ph.length) this.finish(now);
      else this.loop();
      return;
    }
    if (st === 'stopped') {
      if (this.opts.onStoppedPress && this.opts.onStoppedPress()) { this.ignoreUp = true; return; }
      this.reset(false);
      st = 'idle';
    }
    if (st === 'idle' || (st === 'idle' && this.inspecting)) {
      this.pressing = true;
      this.setState('holding');
      this.armHold();
    } else if (this.inspecting && st === 'inspecting') {
      this.pressing = true;
      this.setState('holding');
      this.armHold();
    }
  };

  CubeTimer.prototype.armHold = function () {
    var self = this;
    clearTimeout(this.holdTimer);
    if (this.options().inspection && !this.inspecting) return; // la primera pulsación solo inicia la inspección
    this.holdTimer = setTimeout(function () { if (self.state === 'holding') self.setState('ready'); }, HOLD_MS);
  };

  CubeTimer.prototype.release = function () {
    if (this.ignoreUp) { this.ignoreUp = false; return; }
    if (!this.pressing) return;
    this.pressing = false;
    clearTimeout(this.holdTimer);
    var insp = this.options().inspection;
    if (this.state === 'ready') {
      this.startRun();
    } else if (this.state === 'holding') {
      if (insp && !this.inspecting) {
        this.inspecting = true;
        ScreenWake.acquire();
        this.inspStart = performance.now();
        this.state = 'inspecting';
        this.loop();
      } else if (this.inspecting) {
        this.setState('inspecting');
      } else {
        this.setState('idle');
      }
    }
  };

  CubeTimer.prototype.startRun = function () {
    var now = performance.now();
    this.penalty = null;
    if (this.inspecting) {
      var el = now - this.inspStart;
      if (el > 17000) this.penalty = 'DNF';
      else if (el > 15000) this.penalty = '+2';
    }
    this.inspecting = false;
    this.inspStart = 0;
    this.startT = now;
    this.splits = [];
    this.state = 'running';
    ScreenWake.acquire();
    this.loop();
  };

  CubeTimer.prototype.finish = function (now) {
    var time = Math.round(now - this.startT);
    var ph = this.options().phases;
    var splits = ph ? this.splits.slice() : null;
    if (splits) splits[splits.length - 1] = time;
    this.result = { time: time, penalty: this.penalty || null, splits: splits, phases: ph ? ph.slice(0, splits.length) : null };
    this.state = 'stopped';
    ScreenWake.release();
    cancelAnimationFrame(this.raf);
    this.emit();
    if (this.opts.onFinish) this.opts.onFinish(this.result);
  };

  CubeTimer.prototype.reset = function (emit) {
    clearTimeout(this.holdTimer);
    cancelAnimationFrame(this.raf);
    this.state = 'idle';
    ScreenWake.release();
    this.inspecting = false;
    this.inspStart = 0;
    this.splits = [];
    this.pressing = false;
    this.ignoreUp = false;
    this.result = null;
    if (emit !== false) this.emit();
  };

  CubeTimer.prototype.cancelInspection = function () {
    if (this.inspecting || this.state === 'holding' || this.state === 'ready') this.reset();
  };

  // ---- teclado global ----
  function active() {
    for (var i = 0; i < instances.length; i++) if (instances[i].opts.isActive && instances[i].opts.isActive()) return instances[i];
    return null;
  }
  document.addEventListener('keydown', function (e) {
    if (typing(e) || modalOpen()) return;
    var t = active();
    if (!t) return;
    if (e.code === 'Escape') { t.cancelInspection(); return; }
    if (e.code === 'Space') e.preventDefault();
    if (e.repeat) { if (t.state === 'running') e.preventDefault(); return; }
    if (t.state === 'running') { e.preventDefault(); t.press(); return; }
    if (e.code === 'Space') t.press();
  });
  document.addEventListener('keyup', function (e) {
    if (typing(e) || modalOpen()) return;
    var t = active();
    if (!t) return;
    if (e.code === 'Space') { e.preventDefault(); t.release(); }
    else if (t.ignoreUp) t.ignoreUp = false;
  });
  // Evita que Espacio haga scroll aunque el foco esté en un botón
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !typing(e) && active() && e.target && e.target.tagName === 'BUTTON') e.preventDefault();
  }, true);

  // true si algún cronómetro está en pulsación, preparado, inspección o corriendo
  CubeTimer.anyBusy = function () {
    for (var i = 0; i < instances.length; i++) {
      var st = instances[i].state;
      if (st === 'holding' || st === 'ready' || st === 'inspecting' || st === 'running' || instances[i].inspecting) return true;
    }
    return false;
  };

  root.CubeTimer = CubeTimer;
})(window);
