// Pruebas del contenido bilingüe (plan y algoritmos). Ejecutar: node tests/content.test.js
'use strict';
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
let passed = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  passed++;
}
function eq(a, b, msg) {
  assert.deepStrictEqual(a, b, msg);
  passed++;
}

// Without I18N -> English
delete globalThis.I18N;
const PLANS = require(path.join(root, 'js', 'plan.js'));
const ALGS = require(path.join(root, 'js', 'algs.js'));

// ---------- plan: parity ----------
function nonEmpty(s, where) {
  ok(typeof s === 'string' && s.trim().length > 0, 'empty string at ' + where);
}
const en = PLANS.en;
const es = PLANS.es;
eq(Object.keys(en).sort(), Object.keys(es).sort(), 'top-level keys');
nonEmpty(en.intro, 'en.intro');
nonEmpty(es.intro, 'es.intro');
eq(en.phases.length, es.phases.length, 'phase count');
ok(en.phases.length > 0, 'has phases');
en.phases.forEach(function (pe, i) {
  const ps = es.phases[i];
  const w = 'phase ' + pe.id;
  eq(pe.id, ps.id, w + ' id');
  eq(pe.goalMs, ps.goalMs, w + ' goalMs');
  ['title', 'weeks', 'goal', 'summary'].forEach(function (k) {
    nonEmpty(pe[k], w + ' en.' + k);
    nonEmpty(ps[k], w + ' es.' + k);
  });
  ok(pe.title.indexOf('·') >= 0, w + ' en title has middle dot');
  ok(ps.title.indexOf('·') >= 0, w + ' es title has middle dot');
  ok(/^Phase \d/.test(pe.title), w + ' en title format');
  ok(/^Fase \d/.test(ps.title), w + ' es title format');
  eq(pe.sections.length, ps.sections.length, w + ' section count');
  pe.sections.forEach(function (se, j) {
    const ss = ps.sections[j];
    nonEmpty(se.heading, w + ' en heading');
    nonEmpty(ss.heading, w + ' es heading');
    eq(se.items.length, ss.items.length, w + ' item count in section ' + j);
    se.items.forEach(function (t, k) { nonEmpty(t, w + ' en item ' + j + '.' + k); });
    ss.items.forEach(function (t, k) { nonEmpty(t, w + ' es item ' + j + '.' + k); });
  });
  eq(pe.milestones.map(function (m) { return m.id; }), ps.milestones.map(function (m) { return m.id; }), w + ' milestone ids');
  pe.milestones.forEach(function (m) { nonEmpty(m.text, w + ' en milestone'); });
  ps.milestones.forEach(function (m) { nonEmpty(m.text, w + ' es milestone'); });
});
nonEmpty(en.routine.title, 'en routine title');
nonEmpty(es.routine.title, 'es routine title');
eq(en.routine.blocks.length, es.routine.blocks.length, 'routine blocks');
en.routine.blocks.forEach(function (b, i) {
  const s = es.routine.blocks[i];
  eq(b.minutes, s.minutes, 'routine minutes ' + i);
  ['minutes', 'title', 'text'].forEach(function (k) { nonEmpty(b[k], 'en block ' + k); nonEmpty(s[k], 'es block ' + k); });
});
eq(en.tips.length, es.tips.length, 'tips count');
en.tips.forEach(function (t) { nonEmpty(t, 'en tip'); });
es.tips.forEach(function (t) { nonEmpty(t, 'es tip'); });

// ---------- plan: getter ----------
eq(globalThis.TRAINING_PLAN, en, 'TRAINING_PLAN is en without I18N');
eq(globalThis.TRAINING_PLANS, PLANS, 'TRAINING_PLANS exposed');
globalThis.I18N = { lang: 'es', pick: function (o) { return o.es; } };
eq(globalThis.TRAINING_PLAN, es, 'TRAINING_PLAN is es with I18N=es');
globalThis.I18N = { lang: 'en', pick: function (o) { return o.en; } };
eq(globalThis.TRAINING_PLAN, en, 'TRAINING_PLAN is en with I18N=en');

// ---------- algs ----------
const IDS = ['eo-line', 'eo-l', 'eo-dot', 'ocll-sune', 'ocll-antisune', 'ocll-h', 'ocll-pi', 'ocll-u', 'ocll-t', 'ocll-l',
  'cp-adj', 'cp-diag', 'ep-ua', 'ep-ub', 'ep-h', 'ep-z'];
eq(ALGS.length, 16, '16 algs');
eq(ALGS.map(function (x) { return x.id; }), IDS, 'alg ids unchanged');
ALGS.forEach(function (x) {
  ['name', 'setName', 'tip'].forEach(function (k) {
    ok(x.i18n[k] && typeof x.i18n[k].en === 'string' && x.i18n[k].en.trim(), x.id + ' en ' + k);
    ok(typeof x.i18n[k].es === 'string' && x.i18n[k].es.trim(), x.id + ' es ' + k);
  });
});

delete globalThis.I18N;
ALGS.forEach(function (x) {
  ['name', 'setName', 'tip'].forEach(function (k) { eq(x[k], x.i18n[k].en, x.id + ' ' + k + ' en without I18N'); });
});
globalThis.I18N = { lang: 'es', pick: function (o) { return o.es; } };
ALGS.forEach(function (x) {
  ['name', 'setName', 'tip'].forEach(function (k) { eq(x[k], x.i18n[k].es, x.id + ' ' + k + ' es with I18N'); });
});
const enSetNames = ['1 · Yellow cross', '2 · Orient corners', '3 · Permute corners', '4 · Permute edges'];
ALGS.forEach(function (x) { ok(enSetNames.indexOf(x.i18n.setName.en) >= 0, x.id + ' en setName'); });
delete globalThis.I18N;

// ---------- Spanish texts unchanged vs the original (Spanish-only) version ----------
// Se compara con el primer commit del repositorio, anterior a la versión bilingüe.
let headAlgs = null;
let headPlan = null;
try {
  const git = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 });
  const first = git('git rev-list --max-parents=0 HEAD').trim().split(/\s+/).pop();
  const algsSrc = git('git show ' + first + ':js/algs.js');
  const planSrc = git('git show ' + first + ':js/plan.js');
  const m = { exports: {} };
  vm.runInNewContext(algsSrc, { module: m, globalThis: {} });
  headAlgs = m.exports;
  const win = {};
  vm.runInNewContext(planSrc, { window: win });
  headPlan = win.TRAINING_PLAN;
} catch (e) {
  console.log('AVISO: no se pudo leer HEAD con git; se omite la comparación (' + String(e.message).split('\n')[0] + ')');
}
if (headAlgs && Array.isArray(headAlgs) && headAlgs.length === 16 && !headAlgs[0].i18n) {
  eq(headAlgs.length, ALGS.length, 'HEAD algs length');
  headAlgs.forEach(function (h, i) {
    const x = ALGS[i];
    eq(x.id, h.id, 'HEAD id ' + h.id);
    eq(x.set, h.set, 'HEAD set ' + h.id);
    eq(x.alg, h.alg, 'HEAD alg ' + h.id);
    eq(x.mask, h.mask, 'HEAD mask ' + h.id);
    eq(x.i18n.name.es, h.name, 'HEAD es name ' + h.id);
    eq(x.i18n.setName.es, h.setName, 'HEAD es setName ' + h.id);
    eq(x.i18n.tip.es, h.tip, 'HEAD es tip ' + h.id);
  });
} else if (headAlgs) {
  console.log('AVISO: la versión original de algs.js ya es bilingüe; se omite la comparación con el original en español.');
}
if (headPlan && headPlan.phases && typeof headPlan.intro === 'string') {
  eq(JSON.parse(JSON.stringify(es)), JSON.parse(JSON.stringify(headPlan)), 'es plan identical to HEAD');
} else if (headPlan) {
  console.log('AVISO: la versión original de plan.js ya es bilingüe; se omite la comparación con el original en español.');
}

console.log(passed + ' ok, 0 fallos');
