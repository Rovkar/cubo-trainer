// Pruebas de js/i18n.js (sin dependencias): node tests/i18n.test.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let fails = 0;
function ok(c, msg) { if (!c) { fails++; console.error('FALLA: ' + msg); } else console.log('ok  ' + msg); }
function eq(a, b, msg) { ok(a === b, msg + (a === b ? '' : ' (obtuvo ' + JSON.stringify(a) + ', esperaba ' + JSON.stringify(b) + ')')); }

const SRC = fs.readFileSync(path.join(root, 'js', 'i18n.js'), 'utf8');
// Carga i18n.js como en el navegador: window + localStorage simulados (seed = contenido inicial)
function boot(seed) {
  const ls = Object.assign({}, seed || {});
  const doc = { documentElement: { lang: '' } };
  const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } }, document: doc, console };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(SRC, sb);
  return { I: sb.I18N, ls, doc };
}

// ---- carga en Node puro (sin window/localStorage/document) ----
{
  const I = require(path.join(root, 'js', 'i18n.js'));
  eq(I.lang, 'en', 'Node: idioma por defecto en');
  eq(I.t('tab.timer'), 'Timer', 'Node: t() funciona sin window');
  ok(Array.isArray(I.LANGS) && I.LANGS.join() === 'en,es', 'LANGS = [en, es]');
}

// ---- claves ----
const { I } = boot();
const en = Object.keys(I.dict.en).sort(), es = Object.keys(I.dict.es).sort();
ok(en.length > 100, 'diccionario con ' + en.length + ' claves');
eq(en.filter((k) => !(k in I.dict.es)).join(',') || '-', '-', 'toda clave en en existe en es');
eq(es.filter((k) => !(k in I.dict.en)).join(',') || '-', '-', 'toda clave en es existe en en');
const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join('');
const badPh = en.filter((k) => I.dict.es[k] !== undefined && ph(I.dict.en[k]) !== ph(I.dict.es[k]));
eq(badPh.join(',') || '-', '-', 'mismos marcadores {x} en ambos idiomas');
ok(en.every((k) => I.dict.en[k] !== '' && I.dict.es[k] !== ''), 'sin textos vacíos');
ok('tab.notation' in I.dict.en && 'notation.howToRead' in I.dict.es, 'claves reservadas para notación');

// ---- claves usadas en el código ----
function scan() {
  const files = ['index.html'].concat(fs.readdirSync(path.join(root, 'js')).filter((f) => /\.js$/.test(f)).map((f) => 'js/' + f));
  const used = {};
  files.forEach((f) => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    let m;
    const add = (k) => { (used[k] = used[k] || []).push(f); };
    const re1 = /\bt\('([^']+)'/g;                       // t('x') e I18N.t('x')
    while ((m = re1.exec(src))) add(m[1]);
    const re2 = /data-i18n(?:-[a-z]+)?="([^"]+)"/g;       // atributos en HTML y en plantillas JS
    while ((m = re2.exec(src))) add(m[1]);
    const re3 = /(?<![\w$.])d\('([a-z]\w*(?:\.\w+)+)'\)/g; // ayudante d('x') de app.js
    while ((m = re3.exec(src))) add(m[1]);
  });
  return used;
}
const used = scan();
// se omiten prefijos de claves dinámicas ('phase.' + k) y las 'nt.' / 'n4.' de notation.js y notation4.js (las comprueban sus propios tests)
const keys = Object.keys(used).filter((k) => k.indexOf('nt.') !== 0 && k.indexOf('n4.') !== 0 && /^[a-z]\w*(\.\w+)+$/.test(k));
ok(keys.length > 80, 'claves usadas detectadas: ' + keys.length);
const missing = keys.filter((k) => !(k in I.dict.en) || !(k in I.dict.es));
eq(missing.map((k) => k + ' (' + used[k][0] + ')').join(', ') || '-', '-', 'toda clave usada existe en en y es');
// claves construidas dinámicamente en el código
const dyn = ['phase.cross', 'phase.firstLayer', 'phase.secondLayer', 'phase.lastLayer', 'phase.f2l', 'phase.oll', 'phase.pll',
  'status.nuevo', 'status.aprendiendo', 'status.dominado', 'sync.local', 'sync.connecting', 'sync.synced', 'sync.saving', 'sync.error'];
eq(dyn.filter((k) => !(k in I.dict.en) || !(k in I.dict.es)).join(',') || '-', '-', 'claves dinámicas existen');

// ---- idioma por defecto y persistencia ----
{
  const b = boot();
  eq(b.I.lang, 'en', 'idioma por defecto en con almacenamiento vacío');
  eq(b.I.t('profile.new.btn'), '+ New profile', 't() en inglés');
  eq(b.I.locale(), 'en-US', 'locale en');
  let n = 0, got = null; b.I.onChange((l) => { n++; got = l; });
  b.I.setLang('es');
  eq(b.I.lang, 'es', 'setLang(es)');
  eq(b.ls['cubotrainer.lang'], 'es', 'setLang persiste en cubotrainer.lang');
  eq(b.doc.documentElement.lang, 'es', 'setLang actualiza html lang');
  eq(b.I.t('profile.new.btn'), '+ Nuevo perfil', 't() cambia a español');
  eq(b.I.locale(), 'es-ES', 'locale es');
  ok(n === 1 && got === 'es', 'onChange notifica una vez');
  b.I.setLang('es'); eq(n, 1, 'setLang del mismo idioma no notifica');
  b.I.setLang('fr'); eq(b.I.lang, 'es', 'setLang inválido se ignora');
  eq(Object.keys(b.ls).join(), 'cubotrainer.lang', 'solo se escribe cubotrainer.lang');
  b.I.setLang('en'); eq(b.ls['cubotrainer.lang'], 'en', 'vuelta a en');
}
eq(boot({ 'cubotrainer.lang': 'es' }).I.lang, 'es', 'preferencia guardada es se respeta al cargar');
eq(boot({ 'cubotrainer.lang': 'es' }).doc.documentElement.lang, 'es', 'html lang al cargar con es');
eq(boot({ 'cubotrainer.lang': 'xx' }).I.lang, 'en', 'valor inválido guardado -> en');
{
  const sb = { localStorage: { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } }, console };
  sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  eq(sb.I18N.lang, 'en', 'localStorage que lanza -> en');
  sb.I18N.setLang('es'); eq(sb.I18N.lang, 'es', 'setLang no falla si localStorage lanza');
}

// ---- t / extend / pick ----
{
  const I2 = boot().I;
  eq(I2.t('no.existe'), 'no.existe', 't() devuelve la clave si no existe');
  eq(I2.t('quick.best', { time: '9.87' }), 'Best 9.87', 't() sustituye {time}');
  eq(I2.t('profile.opt.many', { name: 'A', n: 3 }), 'A (3 solves)', 't() con varios parámetros');
  eq(I2.t('quick.best'), 'Best {time}', 't() sin parámetros deja el marcador');
  I2.extend({ en: { 'nt.x': 'Only EN', 'nt.y': 'Y en' }, es: { 'nt.y': 'Y es' } });
  eq(I2.t('nt.y'), 'Y en', 'extend en');
  I2.setLang('es');
  eq(I2.t('nt.y'), 'Y es', 'extend es');
  eq(I2.t('nt.x'), 'Only EN', 'fallback a en si falta en es');
  eq(I2.pick({ en: 'hello', es: 'hola' }), 'hola', 'pick es');
  eq(I2.pick({ en: 'hello' }), 'hello', 'pick cae a en');
  I2.setLang('en');
  eq(I2.pick({ en: 'hello', es: 'hola' }), 'hello', 'pick en');
}

// ---- apply (DOM mínimo) ----
{
  const mk = (attrs) => ({ attrs: Object.assign({}, attrs), textContent: '', setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; } });
  const a = mk({ 'data-i18n': 'tab.timer' }), t2 = mk({ 'data-i18n-title': 'lang.label' }), c = mk({ 'data-i18n-aria': 'lang.label' }), d = mk({ 'data-i18n-placeholder': 'set.customPlaceholder' });
  const rootEl = { querySelectorAll(sel) { return [a, t2, c, d].filter((e) => sel.slice(1, -1) in e.attrs); } };
  const b = boot(); b.I.setLang('es'); b.I.apply(rootEl);
  ok(a.textContent === 'Cronómetro' && t2.attrs.title === 'Idioma' && c.attrs['aria-label'] === 'Idioma' && d.attrs.placeholder === 'Cruz, F2L, OLL, PLL', 'apply escribe texto, title, aria-label y placeholder');
}

// ---- nombres de fase ----
{
  const I3 = boot().I;
  const expect = { cross: ['Cross', 'Cruz', 'cross', ' cruz '], firstLayer: ['First layer', 'Primera capa', 'firstLayer', 'PRIMERA CAPA'],
    secondLayer: ['Second layer', 'Segunda capa', 'secondLayer'], lastLayer: ['Last layer', 'Última capa', 'ultima capa', 'lastLayer', 'ÚLTIMA CAPA'],
    f2l: ['F2L', 'f2l'], oll: ['OLL'], pll: ['PLL', 'pll'] };
  Object.keys(expect).forEach((k) => expect[k].forEach((n) => eq(I3.phaseKey(n), k, 'phaseKey("' + n + '") = ' + k)));
  eq(I3.phaseKey('Mi fase'), null, 'phaseKey de nombre propio = null');
  eq(I3.phaseKey(null), null, 'phaseKey(null) = null');
  eq(I3.phaseName('Cruz'), 'Cross', 'en: phaseName("Cruz") = Cross');
  eq(I3.phaseName('Última capa'), 'Last layer', 'en: phaseName("Última capa")');
  eq(I3.phaseName('Mi fase'), 'Mi fase', 'fase propia se muestra tal cual');
  I3.setLang('es');
  eq(I3.phaseName('Cross'), 'Cruz', 'es: phaseName("Cross") = Cruz');
  eq(I3.phaseName('Second layer'), 'Segunda capa', 'es: phaseName("Second layer")');
  eq(I3.phaseName('cross'), 'Cruz', 'es: phaseName(clave cross)');
}

// ---- phaseBreakdown agrupa fases en ambos idiomas ----
{
  const Stats = require(path.join(root, 'js', 'stats.js'));
  const es4 = ['Cruz', 'Primera capa', 'Segunda capa', 'Última capa'], en4 = ['Cross', 'First layer', 'Second layer', 'Last layer'];
  const solves = [
    { penalty: null, splits: [1000, 3000, 6000, 10000], phases: es4 },
    { penalty: null, splits: [3000, 5000, 10000, 14000], phases: en4 },
  ];
  eq(Stats.phaseBreakdown(solves).count, 1, 'sin keyFn: nombres distintos no se agrupan (compatibilidad)');
  const I4 = boot().I;
  const pb = Stats.phaseBreakdown(solves, 12, I4.phaseKey);
  eq(pb.count, 2, 'con phaseKey: solves es + en se agrupan');
  eq(pb.phases[0].avgMs, 2000, 'media de la fase 1 de ambos');
  eq(pb.phases.map((p) => p.name).join('|'), en4.join('|'), 'nombres de la última resolución como referencia');
  const custom = [{ penalty: null, splits: [1, 3], phases: ['A', 'B'] }, { penalty: null, splits: [2, 4], phases: ['C', 'D'] }];
  eq(Stats.phaseBreakdown(custom, 12, I4.phaseKey).count, 1, 'fases propias distintas no se mezclan (keyFn null -> nombre)');
}

if (fails) { console.error(fails + ' pruebas fallaron'); process.exit(1); }
console.log('Todas las pruebas pasaron');
