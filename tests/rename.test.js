// Renombrar perfiles: node tests/rename.test.js
// Cubre Storage.renameSession (recorte, vacío, 40 caracteres) y que el botón de la cabecera existe, está
// traducido (en y es) y está enlazado al mismo diálogo que Estadísticas > Gestionar.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
let fails = 0;
function ok(c, msg) { if (!c) { fails++; console.error('FALLA: ' + msg); } else console.log('ok  ' + msg); }

function boot(seed) {
  const ls = {};
  if (seed) ls['cubotrainer.v1'] = JSON.stringify(seed);
  const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } }, console };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(read('js/storage.js'), sb);
  return { S: sb.Storage, ls };
}

// ---- Storage.renameSession ----
{
  const { S, ls } = boot({ sessions: [{ id: 'a', name: 'Sesión 1', created: 1, solves: [] }], activeSessionId: 'a' });
  const name = () => S.get().sessions[0].name;
  const stored = () => JSON.parse(ls['cubotrainer.v1']).sessions[0].name;
  ok(S.renameSession('a', '  Hijo  ') === true && name() === 'Hijo' && stored() === 'Hijo', 'renombra recortando espacios y lo guarda');
  ok(S.renameSession('a', '   ') === false && name() === 'Hijo', 'un nombre en blanco se ignora');
  ok(S.renameSession('a', '') === false && S.renameSession('a', null) === false && name() === 'Hijo', 'vacío y null se ignoran');
  ok(S.renameSession('a', 'Hijo') === false, 'el mismo nombre no cuenta como cambio');
  const long = 'x'.repeat(60);
  S.renameSession('a', long);
  ok(name() === 'x'.repeat(40) && stored().length === 40, 'el nombre se limita a 40 caracteres (' + name().length + ')');
  S.renameSession('a', 'y'.repeat(39) + '  zzzz');
  ok(name() === 'y'.repeat(39), 'tras recortar a 40 no queda un espacio final');
  ok(S.renameSession('zzz', 'Otro') === false && name() === 'y'.repeat(39), 'un id inexistente no cambia nada');
  const np = S.newSession('  ' + 'n'.repeat(50) + ' ');
  ok(np.name === 'n'.repeat(40), 'un perfil nuevo también recorta y limita el nombre');
}

// ---- cabecera: botón de renombrar ----
{
  const html = read('index.html');
  const m = html.match(/<button[^>]*id="rename-session"[^>]*>/);
  ok(!!m, 'index.html: existe #rename-session');
  const box = html.slice(html.indexOf('class="session-box"'), html.indexOf('</div>', html.indexOf('class="session-box"')));
  ok(box.indexOf('id="session-select"') < box.indexOf('id="rename-session"') && box.indexOf('id="rename-session"') < box.indexOf('id="new-session"'), 'el botón está junto al selector de perfil, antes de "+ Nuevo perfil"');
  ok(m && /aria-label="[^"]+"/.test(m[0]) && /title="[^"]+"/.test(m[0]) && /data-i18n-title="profile\.rename\.title"/.test(m[0]) && /data-i18n-aria="profile\.rename\.title"/.test(m[0]), 'tiene aria-label y title (traducibles)');
  const I = require(path.join(root, 'js', 'i18n.js'));
  ok(I.dict.en['profile.rename.title'] === 'Rename profile' && I.dict.es['profile.rename.title'] === 'Renombrar perfil', 'claves profile.rename.title en en y es');
  ok(I.dict.en['profile.renamed'] === 'Profile renamed' && I.dict.es['profile.renamed'] === 'Perfil renombrado', 'claves profile.renamed (aviso) en en y es');
  const app = read('js/app.js');
  ok(/\$\('rename-session'\)\.onclick = renameActive/.test(app) && /\$\('m-rename'\)\.onclick = renameActive/.test(app), 'cabecera y Gestionar usan el mismo diálogo (renameActive)');
  ok(/toast\(t\('profile\.renamed'\)\)/.test(app), 'tras renombrar se muestra el aviso');
}

console.log(fails ? fails + ' fallos' : 'todo ok');
process.exit(fails ? 1 : 0);
