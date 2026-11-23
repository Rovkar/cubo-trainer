// Pruebas de js/puzzle.js (sin dependencias): node tests/puzzle.test.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let fails = 0;
function ok(c, msg) { if (!c) { fails++; console.error('FALLA: ' + msg); } else console.log('ok  ' + msg); }
function eq(a, b, msg) { ok(a === b, msg + (a === b ? '' : ' (obtuvo ' + JSON.stringify(a) + ', esperaba ' + JSON.stringify(b) + ')')); }

const SRC = fs.readFileSync(path.join(root, 'js', 'puzzle.js'), 'utf8');
const Cube4 = require(path.join(root, 'js', 'cube4.js'));
const Cube = require(path.join(root, 'js', 'cube.js'));
const Stats = require(path.join(root, 'js', 'stats.js'));
const I18N = require(path.join(root, 'js', 'i18n.js'));

// Carga puzzle.js como en el navegador: window + localStorage simulados (seed = contenido inicial)
function boot(seed, extra) {
  const ls = Object.assign({}, seed || {});
  const sb = Object.assign({ localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } }, console }, extra || {});
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(SRC, sb);
  return { P: sb.Puzzle, ls, sb };
}

// ---- carga en Node puro ----
{
  const P = require(path.join(root, 'js', 'puzzle.js'));
  eq(P.current(), '3x3', 'Node: puzzle por defecto 3x3');
  eq(P.N(), 3, 'Node: N() = 3');
  ok(P.engine() === Cube, 'Node: engine() resuelve Cube');
  ok(Array.isArray(P.LIST) && P.LIST.join() === '3x3,4x4', 'LIST = [3x3, 4x4]');
  P.set('4x4');
  ok(P.is4() && P.N() === 4 && P.engine() === Cube4, 'Node: tras set(4x4), is4/N/engine = Cube4');
  P.set('3x3');
}

// ---- API: valor por defecto, persistencia, notificacion ----
{
  const b = boot();
  const P = b.P;
  eq(P.current(), '3x3', 'por defecto 3x3 con almacenamiento vacio');
  eq(P.is4(), false, 'is4 false por defecto');
  eq(P.N(), 3, 'N() = 3 por defecto');
  let n = 0, got = null; P.onChange((p) => { n++; got = p; });
  P.set('4x4');
  eq(P.current(), '4x4', 'set(4x4)');
  eq(b.ls['cubotrainer.ntSize'], '4x4', 'persiste en cubotrainer.ntSize');
  ok(n === 1 && got === '4x4', 'onChange notifica una vez con el nuevo valor');
  eq(P.is4(), true, 'is4 true'); eq(P.N(), 4, 'N() = 4');
  P.set('4x4'); eq(n, 1, 'set del mismo valor no notifica');
  eq(P.set('5x5'), false, 'set invalido devuelve false');
  eq(P.current(), '4x4', 'set invalido se ignora');
  eq(n, 1, 'set invalido no notifica');
  P.set(undefined); P.set(null); P.set(4); eq(P.current(), '4x4', 'tipos invalidos se ignoran');
  P.set('3x3'); ok(n === 2 && got === '3x3', 'vuelta a 3x3 notifica');
  eq(Object.keys(b.ls).join(), 'cubotrainer.ntSize', 'solo se escribe cubotrainer.ntSize');
  // un oyente que lanza no impide a los demas
  const c = boot().P; let seen = 0;
  c.onChange(() => { throw new Error('x'); }); c.onChange(() => { seen++; });
  c.set('4x4'); eq(seen, 1, 'un oyente que lanza no rompe a los demas');
}
eq(boot({ 'cubotrainer.ntSize': '4x4' }).P.current(), '4x4', 'se respeta el valor guardado 4x4 al cargar');
eq(boot({ 'cubotrainer.ntSize': '3x3' }).P.current(), '3x3', 'se respeta el valor guardado 3x3');
eq(boot({ 'cubotrainer.ntSize': '9x9' }).P.current(), '3x3', 'valor guardado invalido -> 3x3');
{
  const sb = { localStorage: { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } }, console };
  sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  eq(sb.Puzzle.current(), '3x3', 'localStorage que lanza -> 3x3');
  let n = 0; sb.Puzzle.onChange(() => n++);
  sb.Puzzle.set('4x4');
  ok(sb.Puzzle.current() === '4x4' && n === 1, 'set funciona (en memoria) si localStorage lanza');
}
{
  const sb = {}; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  eq(sb.Puzzle.current(), '3x3', 'sin localStorage -> 3x3');
  sb.Puzzle.set('4x4'); eq(sb.Puzzle.current(), '4x4', 'sin localStorage: set funciona');
}

// ---- engine() se resuelve en cada llamada ----
{
  const b = boot();
  eq(b.P.engine(), null, 'sin motores cargados engine() = null (no lanza)');
  b.sb.Cube = { id: 'c3' }; b.sb.Cube4 = { id: 'c4' };
  eq(b.P.engine().id, 'c3', 'engine() = root.Cube en 3x3');
  b.P.set('4x4');
  eq(b.P.engine().id, 'c4', 'engine() = root.Cube4 en 4x4');
  b.sb.Cube4 = { id: 'c4b' };
  eq(b.P.engine().id, 'c4b', 'engine() se resuelve al llamar, no al cargar');
}

// ---- ofSolve / solvesOf con resoluciones antiguas sin el campo ----
{
  const P = boot().P;
  const sv = (id, puzzle) => (puzzle === undefined ? { id: id, time: 1000 } : { id: id, time: 1000, puzzle: puzzle });
  const session = { solves: [sv('a'), sv('b', '4x4'), sv('c', '3x3'), sv('d'), sv('e', '4x4'), { id: 'f', time: 5, puzzle: null }, { id: 'g', time: 5, puzzle: '' }] };
  eq(P.ofSolve(sv('a')), '3x3', 'ofSolve sin campo = 3x3');
  eq(P.ofSolve(sv('b', '4x4')), '4x4', 'ofSolve 4x4');
  eq(P.ofSolve({ id: 'z', puzzle: null }), '3x3', 'ofSolve con null = 3x3');
  eq(P.ofSolve(null), '3x3', 'ofSolve(null) = 3x3');
  eq(P.solvesOf(session).map((s) => s.id).join(''), 'acdfg', 'solvesOf en 3x3 incluye las antiguas sin campo');
  eq(P.solvesOf(session, '4x4').map((s) => s.id).join(''), 'be', 'solvesOf(session, 4x4)');
  P.set('4x4');
  eq(P.solvesOf(session).map((s) => s.id).join(''), 'be', 'solvesOf sin p usa el puzzle actual (4x4)');
  eq(P.solvesOf(session, '3x3').map((s) => s.id).join(''), 'acdfg', 'solvesOf(session, 3x3) explicito');
  eq(P.solvesOf({ solves: 'no' }).length, 0, 'solvesOf con solves invalido = []');
  eq(P.solvesOf(null).length, 0, 'solvesOf(null) = []');
  ok(P.solvesOf(session, '3x3') !== session.solves, 'solvesOf devuelve un arreglo nuevo (no altera el perfil)');
  eq(session.solves.length, 7, 'el perfil no se modifica');
}

// ---- estadisticas disjuntas con un perfil mixto ----
{
  const P = boot().P;
  const solves = [];
  // 3x3: 12 resoluciones de 10 s (algunas antiguas sin campo); 4x4: 12 resoluciones de 60 s
  for (let i = 0; i < 12; i++) solves.push(i % 2 ? { id: 'x' + i, time: 10000 } : { id: 'x' + i, time: 10000, puzzle: '3x3' });
  for (let i = 0; i < 12; i++) solves.push({ id: 'y' + i, time: 60000, puzzle: '4x4' });
  solves.push({ id: 'dnf4', time: 70000, penalty: 'DNF', puzzle: '4x4' });
  const session = { solves: solves };
  const t3 = P.solvesOf(session, '3x3').map(Stats.effectiveTime), t4 = P.solvesOf(session, '4x4').map(Stats.effectiveTime);
  eq(t3.length, 12, '3x3: 12 resoluciones'); eq(t4.length, 13, '4x4: 13 resoluciones');
  eq(Stats.averageOf(t3, 12), 10000, 'ao12 de 3x3 solo ve las de 3x3');
  eq(Stats.bestSingle(t3), 10000, 'mejor single 3x3');
  eq(Stats.bestSingle(t4), 60000, 'mejor single 4x4 (no ve los 10 s del 3x3)');
  eq(Stats.mean(t4), 60000, 'media 4x4 sin DNF y sin el 3x3');
  eq(Stats.averageOf(t4, 12), 60000, 'ao12 de 4x4 (el DNF cuenta como el peor y se recorta)');
  eq(t3.filter((v) => v === Infinity).length, 0, 'el DNF de 4x4 no aparece en 3x3');
  eq(P.solvesOf(session, '3x3').length + P.solvesOf(session, '4x4').length, solves.length, 'conjuntos disjuntos que suman todo');
  const ids3 = new Set(P.solvesOf(session, '3x3').map((s) => s.id));
  ok(P.solvesOf(session, '4x4').every((s) => !ids3.has(s.id)), 'ninguna resolucion en ambos puzzles');
  // desglose por fases: las fases de 4x4 no se mezclan con las de 3x3
  const mix = [
    { id: 'p1', time: 9000, penalty: null, splits: [3000, 9000], phases: ['Cruz', 'Resto'], puzzle: '3x3' },
    { id: 'p2', time: 90000, penalty: null, splits: [30000, 60000, 90000], phases: ['Centros', 'Aristas', 'Etapa 3x3'], puzzle: '4x4' },
    { id: 'p3', time: 80000, penalty: null, splits: [20000, 50000, 80000], phases: ['Centers', 'Edges', '3x3 stage'], puzzle: '4x4' },
  ];
  const bd4 = Stats.phaseBreakdown(P.solvesOf({ solves: mix }, '4x4'), 12, I18N.phaseKey);
  eq(bd4.count, 2, 'phaseBreakdown 4x4 agrupa fases es + en');
  eq(bd4.phases.length, 3, 'phaseBreakdown 4x4: 3 fases');
  eq(Stats.phaseBreakdown(P.solvesOf({ solves: mix }, '3x3'), 12, I18N.phaseKey).phases.length, 2, 'phaseBreakdown 3x3 no ve las fases de 4x4');
}

// ---- nombres de fase de 4x4 en ambos idiomas ----
{
  const exp = {
    centers: ['Centers', 'Centros', 'centers', ' CENTROS '],
    edges: ['Edges', 'Aristas', 'Edge pairing', 'Emparejar aristas', 'edges', 'ARISTAS'],
    stage3: ['3x3 stage', '3x3 Stage', 'Etapa 3x3', 'etapa 3x3', 'stage3'],
  };
  Object.keys(exp).forEach((k) => exp[k].forEach((n) => eq(I18N.phaseKey(n), k, 'phaseKey("' + n + '") = ' + k)));
  ['cross', 'firstLayer', 'secondLayer', 'lastLayer', 'f2l', 'oll', 'pll'].forEach((k) => eq(I18N.phaseKey(k), k, 'phaseKey sigue mapeando ' + k));
  eq(I18N.phaseKey('constructor'), null, 'phaseKey no confunde propiedades heredadas de Object');
  eq(I18N.phaseKey('toString'), null, 'phaseKey("toString") = null');
  const names = { en: { centers: 'Centers', edges: 'Edges', stage3: '3x3 stage' }, es: { centers: 'Centros', edges: 'Aristas', stage3: 'Etapa 3x3' } };
  ['en', 'es'].forEach((lang) => {
    ['centers', 'edges', 'stage3'].forEach((k) => {
      ok(I18N.dict[lang]['phase.' + k] === names[lang][k], lang + ': phase.' + k + ' = ' + names[lang][k]);
      eq(I18N.phaseKey(I18N.dict[lang]['phase.' + k]), k, lang + ': el nombre mostrado de ' + k + ' vuelve a su clave');
    });
  });
  // presets de 4x4: cada clave tiene nombre en ambos idiomas y los nombres de uno y otro idioma se agrupan
  ['centers', 'edges', 'stage3', 'cross', 'f2l', 'lastLayer'].forEach((k) => {
    ok(I18N.dict.en['phase.' + k] && I18N.dict.es['phase.' + k], 'phase.' + k + ' existe en en y es');
    eq(I18N.phaseKey(I18N.dict.es['phase.' + k]), I18N.phaseKey(I18N.dict.en['phase.' + k]), 'phase.' + k + ' es y en comparten clave');
  });
  // claves de la cabecera y de los ajustes de 4x4
  ['puzzle.label', 'set.phase4.reduction', 'set.phase4.detailed', 'set.customPlaceholder4', 'set.length4'].forEach((k) =>
    ok(I18N.dict.en[k] && I18N.dict.es[k], 'clave ' + k + ' en en y es'));
  eq(I18N.dict.en['puzzle.label'], 'Puzzle', 'puzzle.label en = Puzzle'); eq(I18N.dict.es['puzzle.label'], 'Cubo', 'puzzle.label es = Cubo');
}

// ---- mezclas de 4x4 ----
{
  const P = boot().P;
  const AX = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
  const ALLOWED = new Set(['U', 'D', 'L', 'R', 'F', 'B', 'Uw', 'Rw', 'Fw']);
  const axisOf = (b) => AX[b.charAt(0)];
  const baseOf = (t) => t.replace(/(2|')$/, '');
  const sufOf = (t) => t.slice(baseOf(t).length);

  function check(scr, len, label) {
    const toks = scr.split(' ');
    if (toks.length !== len) return label + ': longitud ' + toks.length + ' != ' + len;
    for (let i = 0; i < toks.length; i++) {
      const b = baseOf(toks[i]), s = sufOf(toks[i]);
      if (!ALLOWED.has(b)) return label + ': movimiento no permitido ' + toks[i];
      if (['', "'", '2'].indexOf(s) < 0) return label + ': sufijo raro ' + toks[i];
      if (i > 0 && b === baseOf(toks[i - 1])) return label + ': misma base seguida ' + toks[i - 1] + ' ' + toks[i];
      if (i > 0 && b.charAt(0) === baseOf(toks[i - 1]).charAt(0)) return label + ': misma cara seguida ' + toks[i - 1] + ' ' + toks[i];
      if (i > 1 && axisOf(b) === axisOf(baseOf(toks[i - 1])) && axisOf(b) === axisOf(baseOf(toks[i - 2]))) return label + ': tres movimientos en el mismo eje ' + toks.slice(i - 2, i + 1).join(' ');
    }
    return null;
  }

  const lens = [30, 40, 45, 60];
  let bad = null, badParse = null, badCenters = null, badInv = null;
  const seen = {}, sufSeen = {};
  const CENTERS = [5, 6, 9, 10];
  for (let k = 0; k < 2000; k++) {
    const len = lens[k % lens.length];
    const scr = P.scramble4(len);
    bad = bad || check(scr, len, 'mezcla ' + k);
    scr.split(' ').forEach((t) => { seen[baseOf(t)] = 1; sufSeen[sufOf(t)] = 1; });
    let st = null;
    try { st = Cube4.applyAlg(Cube4.solved('wca'), scr); } catch (e) { badParse = badParse || ('no parsea: ' + scr + ' -> ' + e.message); continue; }
    const centersMoved = Cube4.FACES.some((f) => CENTERS.some((i) => st[f][i] !== Cube4.solved('wca')[f][i]));
    if (!centersMoved) badCenters = badCenters || ('centros sin mezclar: ' + scr);
    if (Cube4.isSolved(st)) badInv = badInv || ('mezcla que no mezcla: ' + scr);
    const back = Cube4.applyAlg(st, Cube4.invertAlg(scr));
    if (!Cube4.isSolved(back) || JSON.stringify(back) !== JSON.stringify(Cube4.solved('wca'))) badInv = badInv || ('applyAlg+invertAlg no vuelve a resuelto: ' + scr);
  }
  eq(bad || '-', '-', '2000 mezclas de 4x4 cumplen las reglas (movimientos, base, cara y eje)');
  eq(badParse || '-', '-', '2000 mezclas de 4x4 se interpretan con Cube4');
  eq(badCenters || '-', '-', '2000 mezclas de 4x4 mezclan los centros');
  eq(badInv || '-', '-', 'applyAlg(mezcla) + invertAlg(mezcla) vuelve a resuelto');
  eq(Object.keys(seen).sort().join(), 'B,D,F,Fw,L,R,Rw,U,Uw', 'aparecen los 9 movimientos y ninguno mas');
  eq(Object.keys(sufSeen).sort().join('|'), "|'|2", 'aparecen los tres sufijos');

  // por defecto 40, n = 0 vacia, n invalido -> 40
  eq(P.scramble4().split(' ').length, 40, 'scramble4() = 40 movimientos');
  eq(P.scramble4(0), '', 'scramble4(0) vacia');
  eq(P.scramble4(1).split(' ').length, 1, 'scramble4(1) un movimiento');
  eq(P.scramble4(NaN).split(' ').length, 40, 'scramble4(NaN) = 40');
  eq(P.scramble4('35').split(' ').length, 35, 'scramble4("35") = 35');
  eq(P.scramble4(-3).split(' ').length, 40, 'scramble4(-3) = 40');

  // generador con valores extremos del azar: sigue cumpliendo las reglas
  [0, 0.999999999, 0.5, 0.25, 0.75].forEach((v) => eq(check(P.scramble4(60, () => v), 60, 'rnd=' + v) || '-', '-', 'azar constante ' + v + ' cumple las reglas'));
  // determinista con el mismo azar
  let seed = 7; const lcg = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const a = P.scramble4(40, lcg); seed = 7; const b2 = P.scramble4(40, lcg);
  eq(a, b2, 'mismo generador de azar -> misma mezcla');

  // scramble(len3, len4) segun el puzzle
  const p = boot(null, { Cube: Cube, Cube4: Cube4 }).P;
  eq(p.scramble(20, 40).split(' ').length, 20, 'scramble() en 3x3 usa len3');
  ok(p.scramble(20, 40).split(' ').every((t) => /^[UDLRFB](2|')?$/.test(t)), 'scramble() en 3x3 solo mueve caras');
  p.set('4x4');
  eq(p.scramble(20, 33).split(' ').length, 33, 'scramble() en 4x4 usa len4');
}

if (fails) { console.error(fails + ' pruebas fallaron'); process.exit(1); }
console.log('Todas las pruebas pasaron');
