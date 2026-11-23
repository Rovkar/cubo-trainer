(function (root) {
  'use strict';
  // Modo de puzzle (3x3 | 4x4): preferencia del DISPOSITIVO, igual que el idioma.
  // Clave 'cubotrainer.ntSize' (la misma que ya usaba la pestana Notacion). Nunca se guarda en los datos
  // sincronizados ni en los ajustes del perfil: cada dispositivo recuerda el suyo.
  var KEY = 'cubotrainer.ntSize';
  var LIST = ['3x3', '4x4'];
  var hasWin = typeof window !== 'undefined';
  var listeners = [];
  var cur = null; // se lee de localStorage la primera vez que se necesita (asi tambien funciona con un localStorage simulado)

  function load() {
    var v = null;
    try { v = root.localStorage ? root.localStorage.getItem(KEY) : null; } catch (e) { v = null; }
    return LIST.indexOf(v) >= 0 ? v : '3x3';
  }
  function current() { if (cur === null) cur = load(); return cur; }

  function set(p) {
    if (LIST.indexOf(p) < 0) return false;
    var changed = current() !== p;
    cur = p;
    try { if (root.localStorage) root.localStorage.setItem(KEY, p); } catch (e) { /* ignorar */ }
    if (changed) listeners.slice().forEach(function (fn) { try { fn(p); } catch (e) { /* ignorar */ } });
    return true;
  }

  function resolve(name, file) {
    if (root[name]) return root[name];
    // En Node puro (pruebas) los motores no son globales: se cargan al pedirlos
    if (typeof module !== 'undefined' && typeof require === 'function') {
      try { return require('./' + file); } catch (e) { /* ignorar */ }
    }
    return null;
  }

  function is4() { return current() === '4x4'; }
  function engine() { return is4() ? resolve('Cube4', 'cube4.js') : resolve('Cube', 'cube.js'); }

  // Una resolucion sin el campo puzzle es de 3x3 (las resoluciones anteriores a esta funcion)
  function ofSolve(s) { return (s && s.puzzle) || '3x3'; }
  function solvesOf(session, p) {
    var want = p || current();
    var all = session && Array.isArray(session.solves) ? session.solves : [];
    return all.filter(function (s) { return ofSolve(s) === want; });
  }

  // ---- mezcla de 4x4: n movimientos al azar de {U D L R F B Uw Rw Fw} con sufijo '', ' o 2 ----
  // Nunca la misma cara dos veces seguidas (U y Uw cuentan como la misma cara) ni tres movimientos
  // seguidos sobre un mismo eje (Uw comparte eje con U y D, Rw con R y L, Fw con F y B).
  var MOVES4 = ['U', 'D', 'L', 'R', 'F', 'B', 'Uw', 'Rw', 'Fw'];
  var AXIS4 = { U: 0, D: 0, Uw: 0, L: 1, R: 1, Rw: 1, F: 2, B: 2, Fw: 2 };
  var SUF = ['', "'", '2'];
  function faceOf(m) { return m.charAt(0); }
  function pick(arr, rnd) { return arr[Math.min(arr.length - 1, Math.floor(rnd() * arr.length))]; }
  function scramble4(n, rnd) {
    rnd = rnd || Math.random;
    var len = n == null ? 40 : Math.floor(Number(n));
    if (!isFinite(len) || len < 0) len = 40;
    var out = [];
    for (var i = 0; i < len; i++) {
      var prev = out[i - 1], prev2 = out[i - 2];
      var block = prev && prev2 && AXIS4[prev] === AXIS4[prev2] ? AXIS4[prev] : -1;
      var opts = MOVES4.filter(function (m) { return (!prev || faceOf(m) !== faceOf(prev)) && AXIS4[m] !== block; });
      out.push(pick(opts, rnd));
    }
    return out.map(function (m) { return m + pick(SUF, rnd); }).join(' ');
  }
  // Mezcla del puzzle actual: len3 para 3x3, len4 para 4x4
  function scramble(len3, len4) {
    var C = resolve('Cube', 'cube.js');
    return is4() ? scramble4(len4) : C.randomScramble(len3);
  }

  var Puzzle = {
    LIST: LIST,
    KEY: KEY,
    current: current,
    set: set,
    onChange: function (fn) { listeners.push(fn); },
    is4: is4,
    N: function () { return is4() ? 4 : 3; },
    engine: engine,
    ofSolve: ofSolve,
    solvesOf: solvesOf,
    scramble4: scramble4,
    scramble: scramble,
    MOVES4: MOVES4,
    AXIS4: AXIS4
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Puzzle;
  if (hasWin) root.Puzzle = Puzzle;
})(typeof window !== 'undefined' ? window : globalThis);
