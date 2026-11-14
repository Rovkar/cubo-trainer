(function (root) {
  'use strict';
  var KEY = 'cubotrainer.v1';
  var persistent = true;
  var data = null;

  // Nombre por defecto en el idioma actual (en Node, sin I18N, se mantiene el español)
  function defName(n) { return root.I18N ? root.I18N.t('profile.default', { n: n }) : ('Perfil ' + n); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function defSettings() { return { inspection: false, phaseMode: 'off', customPhases: '', hideTime: false, scrambleLength: 20, showNet: true }; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Completa un perfil con los valores por defecto (g = datos globales antiguos a copiar si el perfil no tiene los suyos)
  function fixProfile(s, g, n) {
    if (!s.id) s.id = uid();
    if (!s.name) s.name = defName(n);
    if (!s.created) s.created = Date.now();
    if (!Array.isArray(s.solves)) s.solves = [];
    var st = s.settings && typeof s.settings === 'object' ? s.settings : (g.settings ? clone(g.settings) : {});
    s.settings = Object.assign(defSettings(), st);
    var tr = s.trainer && typeof s.trainer === 'object' ? s.trainer : (g.trainer ? clone(g.trainer) : {});
    s.trainer = { status: tr.status || {}, times: tr.times || {} };
    var pl = s.plan && typeof s.plan === 'object' ? s.plan : (g.plan ? clone(g.plan) : {});
    s.plan = { milestones: pl.milestones || {} };
    return s;
  }

  function normalize(d) {
    d = d && typeof d === 'object' ? d : {};
    var g = { settings: d.settings, trainer: d.trainer, plan: d.plan };
    d.sessions = Array.isArray(d.sessions) ? d.sessions : [];
    delete d.settings; delete d.trainer; delete d.plan;
    d.sessions.forEach(function (s, i) { fixProfile(s, g, i + 1); });
    if (!d.sessions.length) {
      var s = fixProfile({ id: uid(), name: defName(1), created: Date.now(), solves: [] }, g, 1);
      d.sessions.push(s);
      d.activeSessionId = s.id;
    }
    if (!d.sessions.some(function (x) { return x.id === d.activeSessionId; })) d.activeSessionId = d.sessions[0].id;
    return d;
  }

  function load() {
    var raw = null;
    try {
      raw = root.localStorage.getItem(KEY);
    } catch (e) { persistent = false; }
    var parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
    data = normalize(parsed);
    if (persistent) save();
  }

  var saveHook = null, replaceListeners = [];
  function writeLocal() {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(data));
      persistent = true;
    } catch (e) { persistent = false; }
  }
  function save() {
    writeLocal();
    if (saveHook) { try { saveHook(); } catch (e) { /* el hook no debe romper el guardado */ } }
  }
  function setSaveHook(fn) { saveHook = fn; }
  function onReplace(fn) { replaceListeners.push(fn); }
  function replaceAll(obj, opts) {
    data = normalize(obj);
    if (opts && opts.silent) writeLocal(); else save();
    replaceListeners.slice().forEach(function (fn) { try { fn(data); } catch (e) { /* ignorar */ } });
  }

  function get() { if (!data) load(); return data; }
  function isPersistent() { if (!data) load(); return persistent; }

  function activeSession() {
    var d = get();
    for (var i = 0; i < d.sessions.length; i++) if (d.sessions[i].id === d.activeSessionId) return d.sessions[i];
    return d.sessions[0];
  }
  function setActive(id) {
    var d = get();
    if (!d.sessions.some(function (x) { return x.id === id; })) return;
    d.activeSessionId = id; save();
    replaceListeners.slice().forEach(function (fn) { try { fn(data); } catch (e) { /* ignorar */ } });
  }
  function newSession(name) {
    var d = get();
    var s = fixProfile({ id: uid(), name: cleanName(name) || defName(d.sessions.length + 1), created: Date.now(), solves: [] }, {}, d.sessions.length + 1);
    d.sessions.push(s); d.activeSessionId = s.id; save(); return s;
  }
  // Nombre de perfil: sin espacios sobrantes y de 40 caracteres como máximo ('' = no válido)
  var NAME_MAX = 40;
  function cleanName(n) { return n == null ? '' : String(n).trim().slice(0, NAME_MAX).trim(); }
  // Devuelve true si el nombre cambió (un nombre vacío se ignora)
  function renameSession(id, name) {
    var nm = cleanName(name), changed = false;
    if (!nm) return false;
    get().sessions.forEach(function (s) { if (s.id === id && s.name !== nm) { s.name = nm; changed = true; } });
    if (changed) save();
    return changed;
  }
  function deleteSession(id) {
    var d = get();
    d.sessions = d.sessions.filter(function (s) { return s.id !== id; });
    d = data = normalize(d); save();
  }
  function addSolve(solve) {
    solve.id = solve.id || uid();
    activeSession().solves.push(solve); save(); return solve;
  }
  function deleteSolve(id) {
    var s = activeSession();
    s.solves = s.solves.filter(function (x) { return x.id !== id; }); save();
  }
  function setPenalty(id, p) {
    activeSession().solves.forEach(function (x) { if (x.id === id) x.penalty = p; }); save();
  }
  function settings() { return activeSession().settings; }
  function milestones() { return activeSession().plan.milestones; }
  function setting(k, v) { var st = settings(); if (v !== undefined) { st[k] = v; save(); } return st[k]; }

  function setCaseStatus(id, st) { activeSession().trainer.status[id] = st; save(); }
  function caseStatus(id) { return activeSession().trainer.status[id] || 'nuevo'; }
  function addCaseTime(id, ms) {
    var t = activeSession().trainer.times;
    t[id] = (t[id] || []).concat([ms]).slice(-20); save();
  }
  function caseTimes(id) { return activeSession().trainer.times[id] || []; }
  function setMilestone(id, v) {
    var m = milestones();
    if (v) m[id] = true; else delete m[id];
    save();
  }
  function exportAll() { return JSON.stringify(get(), null, 2); }
  function importAll(text) {
    var parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.sessions)) throw new Error(root.I18N ? root.I18N.t('import.invalid') : 'Formato no válido');
    data = normalize(parsed); save();
  }

  root.Storage = {
    get: get, save: save, uid: uid, isPersistent: isPersistent, activeSession: activeSession, setActive: setActive,
    newSession: newSession, renameSession: renameSession, deleteSession: deleteSession,
    addSolve: addSolve, deleteSolve: deleteSolve, setPenalty: setPenalty, setting: setting, settings: settings, milestones: milestones,
    setCaseStatus: setCaseStatus, caseStatus: caseStatus, addCaseTime: addCaseTime, caseTimes: caseTimes,
    setMilestone: setMilestone, exportAll: exportAll, importAll: importAll,
    setSaveHook: setSaveHook, replaceAll: replaceAll, onReplace: onReplace, cleanName: cleanName, NAME_MAX: NAME_MAX
  };
  root.escHtml = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
