const vm = require('vm');
const fs = require('fs');
const path = require('path');
let fails = 0;
function ok(c, msg) { if (!c) { fails++; console.error('FALLA: ' + msg); } else console.log('ok  ' + msg); }

function boot(seed) {
  const ls = {};
  if (seed) ls['cubotrainer.v1'] = JSON.stringify(seed);
  const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } }, console };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8'), sb);
  return sb.Storage;
}
const v1 = () => ({
  sessions: [{ id: 'a', name: 'Hijo', created: 1, solves: [{ id: 's1', time: 1 }] }, { id: 'b', name: 'Otro', created: 2, solves: [] }],
  activeSessionId: 'a',
  settings: { phaseMode: 'beginner' }, trainer: { status: { 'eo-line': 'dominado' }, times: { 'eo-line': [900] } }, plan: { milestones: { m1: true } }
});

// migración
{
  const S = boot(v1()); const d = S.get();
  ok(d.settings === undefined && d.trainer === undefined && d.plan === undefined, 'globales desaparecen del nivel superior');
  ok(d.sessions.every((s) => s.settings.phaseMode === 'beginner' && s.settings.scrambleLength === 20 && s.trainer.status['eo-line'] === 'dominado' && s.plan.milestones.m1), 'globales copiados a todos los perfiles');
  ok(d.sessions[0].trainer !== d.sessions[1].trainer && d.sessions[0].plan.milestones !== d.sessions[1].plan.milestones, 'copias profundas');
  ok(d.sessions[0].solves.length === 1, 'resoluciones conservadas');
}
// aislamiento
{
  const S = boot(v1());
  S.setMilestone('m2', true); S.setCaseStatus('x', 'aprendiendo'); S.setting('hideTime', true); S.addCaseTime('x', 500);
  const [a, b] = S.get().sessions;
  ok(a.plan.milestones.m2 && !b.plan.milestones.m2, 'setMilestone solo en el activo');
  ok(a.trainer.status.x === 'aprendiendo' && !b.trainer.status.x, 'setCaseStatus solo en el activo');
  ok(a.settings.hideTime === true && b.settings.hideTime === false, 'setting solo en el activo');
  ok(S.caseTimes('x').length === 1 && S.settings() === a.settings && S.milestones() === a.plan.milestones, 'accesores del perfil activo');
  let n = 0; S.onReplace(() => n++);
  S.setActive('b');
  ok(n === 1 && S.caseStatus('x') === 'nuevo' && !S.milestones().m2 && S.caseTimes('x').length === 0, 'setActive notifica y cambia de datos');
  const p = S.newSession('Nuevo');
  ok(p.name === 'Nuevo' && p.solves.length === 0 && Object.keys(p.plan.milestones).length === 0 && Object.keys(p.trainer.status).length === 0 && p.settings.phaseMode === 'off', 'perfil nuevo con valores por defecto');
  ok(S.newSession().name === 'Perfil 4', 'nombre por defecto Perfil n');
}
// importAll v1
{
  const S = boot(null);
  S.importAll(JSON.stringify(v1()));
  const d = S.get();
  ok(d.plan === undefined && d.sessions.length === 2 && d.sessions.every((s) => s.plan.milestones.m1 && s.settings.phaseMode === 'beginner'), 'importAll v1 migra');
  ok(JSON.parse(S.exportAll()).settings === undefined, 'exportAll sin globales');
}
// estado vacío
{
  const S = boot(null);
  ok(S.get().sessions.length === 1 && S.get().sessions[0].name === 'Perfil 1' && S.settings().showNet === true, 'primer arranque: Perfil 1');
}
console.log(fails ? fails + ' fallos' : 'todo ok');
process.exit(fails ? 1 : 0);
