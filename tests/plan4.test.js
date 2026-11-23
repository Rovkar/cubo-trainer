'use strict';
// Tests for the 4x4 training plan (js/plan4.js), the TRAINING_PLAN getter of js/plan.js and js/planview.js following the puzzle mode.
// Run: node tests/plan4.test.js
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const J = (f) => path.join(__dirname, '..', 'js', f);
const PLANS4 = require(J('plan4.js'));
const PLANS3 = require(J('plan.js')); // also defines globalThis.TRAINING_PLAN (getter)
const Cube4 = require(J('cube4.js'));
const P = require(J('parity4.js'));

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const en = PLANS4.en, es = PLANS4.es;

// ---------------------------------------------------------------------------------------------
// 1. Structure: en and es have the same shape (ids, counts, goalMs null)
// ---------------------------------------------------------------------------------------------
(function () {
  check(globalThis.TRAINING_PLANS4 === PLANS4, 'TRAINING_PLANS4 exposed');
  check(eq(Object.keys(PLANS4).sort(), ['en', 'es']), 'plan4 has exactly en and es');
  const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
  ['en', 'es'].forEach((l) => {
    const p = PLANS4[l];
    check(nonEmpty(p.intro), l + ': intro');
    check(Array.isArray(p.phases) && p.phases.length >= 4 && p.phases.length <= 6, l + ': a short plan (4 to 6 phases): ' + p.phases.length);
    check(nonEmpty(p.routine.title) && Array.isArray(p.routine.blocks) && p.routine.blocks.length > 0, l + ': routine');
    p.routine.blocks.forEach((b) => ['minutes', 'title', 'text'].forEach((k) => check(nonEmpty(b[k]), l + ': routine block ' + k)));
    check(Array.isArray(p.tips) && p.tips.length > 0 && p.tips.every(nonEmpty), l + ': tips');
  });
  check(en.phases.length === es.phases.length, 'same number of phases');
  check(eq(en.phases.map((p) => p.id), es.phases.map((p) => p.id)), 'same phase ids in en and es');
  en.phases.forEach((pe, i) => {
    const ps = es.phases[i], w = pe.id;
    check(eq(Object.keys(pe).sort(), Object.keys(ps).sort()) && eq(Object.keys(pe).sort(), ['goal', 'goalMs', 'id', 'milestones', 'sections', 'summary', 'title', 'weeks']), w + ': same keys as the 3x3 plan phases');
    check(pe.goalMs === null && ps.goalMs === null, w + ': goalMs is null (skills, not times)');
    ['title', 'weeks', 'goal', 'summary'].forEach((k) => check(nonEmpty(pe[k]) && nonEmpty(ps[k]), w + ': ' + k + ' in both languages'));
    check(/^Phase \d+ · \S/.test(pe.title) && /^Fase \d+ · \S/.test(ps.title), w + ': titles keep the "Phase N · Name" / "Fase N · Nombre" format');
    check(eq(pe.sections.length, ps.sections.length) && pe.sections.length > 0, w + ': same section count');
    pe.sections.forEach((s, j) => {
      const t = ps.sections[j];
      check(nonEmpty(s.heading) && nonEmpty(t.heading), w + ': section ' + j + ' heading');
      check(s.items.length === t.items.length && s.items.length > 0, w + ': section ' + j + ' same item count');
      s.items.concat(t.items).forEach((x) => check(nonEmpty(x), w + ': section ' + j + ' item not empty'));
    });
    check(eq(pe.milestones.map((m) => m.id), ps.milestones.map((m) => m.id)) && pe.milestones.length >= 3, w + ': same milestone ids (' + pe.milestones.length + ')');
    pe.milestones.concat(ps.milestones).forEach((m) => check(nonEmpty(m.text), w + ': milestone text ' + m.id));
  });
  check(en.routine.blocks.length === es.routine.blocks.length && eq(en.routine.blocks.map((b) => b.minutes), es.routine.blocks.map((b) => b.minutes)), 'routine: same blocks and minutes');
  check(en.tips.length === es.tips.length, 'same number of tips');
  // the phase index in the title follows the order
  en.phases.forEach((p, i) => check(p.title.indexOf('Phase ' + i + ' ·') === 0 && es.phases[i].title.indexOf('Fase ' + i + ' ·') === 0, p.id + ': title number ' + i));
})();

// ---------------------------------------------------------------------------------------------
// 2. Ids: prefixed, unique, simple, and never colliding with the 3x3 plan
// ---------------------------------------------------------------------------------------------
(function () {
  const ids3 = [];
  ['en', 'es'].forEach((l) => PLANS3[l].phases.forEach((p) => { ids3.push(p.id); p.milestones.forEach((m) => ids3.push(m.id)); }));
  const phaseIds = en.phases.map((p) => p.id);
  const msIds = [];
  en.phases.forEach((p) => p.milestones.forEach((m) => msIds.push(m.id)));
  const all = phaseIds.concat(msIds);
  check(all.every((id) => /^p4-[A-Za-z0-9-]+$/.test(id)), 'all ids start with p4- and have no dots or slashes: ' + all.filter((id) => !/^p4-[A-Za-z0-9-]+$/.test(id)).join(','));
  check(new Set(phaseIds).size === phaseIds.length, 'phase ids are unique');
  check(new Set(msIds).size === msIds.length, 'milestone ids are unique');
  check(new Set(all).size === all.length, 'no phase id equals a milestone id');
  check(all.every((id) => ids3.indexOf(id) < 0), 'no id collides with the 3x3 plan ids');
  en.phases.forEach((p) => p.milestones.forEach((m) => check(m.id.indexOf(p.id + '-') === 0, m.id + ' belongs to ' + p.id)));
  check(ids3.every((id) => !/^p4-/.test(id)), 'the 3x3 plan has no p4- ids');
})();

// ---------------------------------------------------------------------------------------------
// 3. Algorithms shown in the plan are the verified ones of Parity4 (and only valid 4x4 notation)
// ---------------------------------------------------------------------------------------------
(function () {
  const codes = (plan) => {
    const out = [];
    const grab = (s) => { (String(s).match(/<code>[^<]*<\/code>/g) || []).forEach((c) => out.push(c.replace(/<\/?code>/g, ''))); };
    grab(plan.intro);
    plan.phases.forEach((p) => {
      grab(p.summary); grab(p.goal);
      p.sections.forEach((s) => s.items.forEach(grab));
      p.milestones.forEach((m) => grab(m.text));
    });
    plan.routine.blocks.forEach((b) => grab(b.text));
    plan.tips.forEach(grab);
    return out;
  };
  const verified = [P.ALGS.OLL_PARITY, P.ALGS.PLL_PARITY].concat(P.TRAINER.map((x) => x.alg4));
  // single letters that are explained as 3x3 notation (the rewrite rule and the warning), never as a 4x4 move to execute
  const EXPLAINED = ['r', 'f', 'M'];
  ['en', 'es'].forEach((l) => {
    const list = codes(PLANS4[l]);
    check(list.length > 10, l + ': the plan shows moves in <code> (' + list.length + ')');
    list.forEach((c) => {
      const toks = c.trim().split(/\s+/);
      if (toks.length >= 3) {
        check(verified.indexOf(c) >= 0, l + ': long sequence is a verified algorithm of the app: ' + c);
      } else if (!(toks.length === 1 && EXPLAINED.indexOf(toks[0]) >= 0)) {
        let ok = true;
        try { Cube4.applyAlg(Cube4.solved('yellowTop'), c); } catch (e) { ok = false; }
        check(ok, l + ': valid 4x4 notation: ' + c);
      }
      // no 4x4 move may be written with a lowercase r/f/M unless it is one of the explained letters
      toks.forEach((t) => check(!/^[rludfbM]['2]?$/.test(t) || (toks.length === 1 && EXPLAINED.indexOf(t) >= 0), l + ': no lowercase move in an algorithm: ' + c));
    });
    // the algorithms of the app really are in the text, exactly as in Parity4
    check(list.indexOf(P.ALGS.OLL_PARITY) >= 0 && list.indexOf(P.ALGS.PLL_PARITY) >= 0, l + ': OLL parity and PLL parity algorithms are shown');
    check(list.indexOf("2L 2R'") >= 0 && list.indexOf('3Rw') >= 0 && list.indexOf('3Fw') >= 0, l + ": the rewrite rule r -> 3Rw, f -> 3Fw, M -> 2L 2R' is shown");
    check(P.to4x4('r') === '3Rw' && P.to4x4('f') === '3Fw' && P.to4x4('M') === "2L 2R'", l + ': the rule agrees with Parity4.to4x4');
  });
  check(eq(codes(en), codes(es)), 'the <code> snippets are identical in en and es, in the same order');
  // what the plan says the algorithms do, on the engine
  const solved = Cube4.solved('yellowTop');
  check(P.classify(Cube4.applyAlg(solved, P.ALGS.OLL_PARITY)) === 'oll-parity', 'OLL parity algorithm of the plan creates exactly the OLL parity state');
  check(P.classify(Cube4.applyAlg(solved, P.ALGS.PLL_PARITY + ' U2')) === 'pll-opposite', 'PLL parity algorithm followed by U2 is a clean swap of two opposite dedges');
  // the plan names the six algorithms that change: the Parity4 data agrees with the count
  check(P.TRAINER.filter((x) => x.changed).length === 6 && /six/.test(en.phases[3].summary) && /seis/.test(es.phases[3].summary), 'phase 3 talks about the six rewritten algorithms and there are six');
  // the plan never uses the removed / ambiguous wording
  ['en', 'es'].forEach((l) => {
    const txt = JSON.stringify(PLANS4[l]);
    check(!/undefined|NaN|\[object/.test(txt), l + ': no undefined / NaN in the texts');
    check(!/<(?!\/?(b|i|code)\b)[a-z]/i.test(JSON.stringify(PLANS4[l]).replace(/\\"/g, '"')), l + ': only <b>, <i> and <code> in the texts');
  });
})();

// ---------------------------------------------------------------------------------------------
// 4. TRAINING_PLAN getter (js/plan.js) follows Puzzle.is4() and the language
// ---------------------------------------------------------------------------------------------
(function () {
  const get = () => globalThis.TRAINING_PLAN;
  check(get() === PLANS3.en, 'no Puzzle: the 3x3 plan (en)');
  globalThis.Puzzle = { is4: () => false };
  check(get() === PLANS3.en, 'fake Puzzle 3x3: the 3x3 plan');
  globalThis.Puzzle = { is4: () => true };
  check(get() === PLANS4.en, 'fake Puzzle 4x4: the 4x4 plan (en)');
  check(get().phases[0].id === 'p4-0', '4x4 plan starts with p4-0');
  globalThis.I18N = { lang: 'es', pick: (o) => o.es };
  check(get() === PLANS4.es, 'fake Puzzle 4x4 + es: the Spanish 4x4 plan');
  globalThis.Puzzle = { is4: () => false };
  check(get() === PLANS3.es, 'fake Puzzle 3x3 + es: the Spanish 3x3 plan');
  let mode = '3x3';
  globalThis.Puzzle = { is4: () => mode === '4x4' };
  globalThis.I18N = { lang: 'en', pick: (o) => o.en };
  check(get() === PLANS3.en, 'switching: starts on 3x3');
  mode = '4x4';
  check(get() === PLANS4.en, 'switching: the next read is the 4x4 plan (resolved at call time)');
  mode = '3x3';
  check(get() === PLANS3.en, 'switching back: the 3x3 plan');
  // a Puzzle without is4 and a missing TRAINING_PLANS4 fall back to the 3x3 plan
  globalThis.Puzzle = {};
  check(get() === PLANS3.en, 'Puzzle without is4: the 3x3 plan');
  globalThis.Puzzle = { is4: () => true };
  const saved = globalThis.TRAINING_PLANS4;
  delete globalThis.TRAINING_PLANS4;
  check(get() === PLANS3.en, '4x4 mode but plan4.js not loaded: the 3x3 plan instead of an error');
  globalThis.TRAINING_PLANS4 = saved;
  delete globalThis.Puzzle; delete globalThis.I18N;
  check(get() === PLANS3.en, 'cleanup: back to the 3x3 plan');
})();

// ---------------------------------------------------------------------------------------------
// 5. PlanView: ao12 and the situation card follow the puzzle (browser files loaded in a sandbox)
// ---------------------------------------------------------------------------------------------
(function () {
  const ls = {};
  const sb = {
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } },
    document: { documentElement: { lang: '' } }, console,
  };
  sb.window = sb;
  vm.createContext(sb);
  ['i18n.js', 'puzzle.js', 'stats.js', 'plan.js', 'plan4.js'].forEach((f) => vm.runInContext(fs.readFileSync(J(f), 'utf8'), sb, { filename: f }));
  sb.escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const solves = [];
  for (let i = 0; i < 12; i++) solves.push({ id: 'a' + i, time: 60000, penalty: 'OK' });                   // 3x3, no puzzle field
  for (let i = 0; i < 12; i++) solves.push({ id: 'b' + i, time: 120000, penalty: 'OK', puzzle: '4x4' });   // 4x4
  const ses = { name: 'Ana', solves: solves };
  let miles = {};
  sb.Storage = { activeSession: () => ses, milestones: () => miles, setMilestone: () => {} };
  vm.runInContext(fs.readFileSync(J('planview.js'), 'utf8'), sb, { filename: 'planview.js' });
  const el = { innerHTML: '', addEventListener() {} };
  sb.PlanView.mount(el);
  const fmt = (ms) => sb.Stats.formatTime(ms);
  const html = () => el.innerHTML;
  const render = () => { sb.PlanView.render(); return html(); };

  // 3x3 mode
  sb.Puzzle.set('3x3');
  let h = render();
  check(h.indexOf('<b>' + fmt(60000) + '</b>') >= 0 && h.indexOf('<b>' + fmt(120000) + '</b>') < 0, '3x3: ao12 comes only from the 3x3 solves');
  check(/Status of Ana · <span class="plan-puzzle">3x3<\/span>/.test(h), '3x3: the situation card says which puzzle the plan is for');
  check(h.indexOf('data-phase="f0"') >= 0 && h.indexOf('data-phase="p4-0"') < 0 && h.indexOf('data-ms="f0-m1"') >= 0, '3x3: the 3x3 plan and its milestone ids');
  // 4x4 mode
  sb.Puzzle.set('4x4');
  h = render();
  check(h.indexOf('<b>' + fmt(120000) + '</b>') >= 0 && h.indexOf('<b>' + fmt(60000) + '</b>') < 0, '4x4: ao12 comes only from the 4x4 solves');
  check(/Status of Ana · <span class="plan-puzzle">4x4<\/span>/.test(h), '4x4: the situation card says 4x4');
  check(h.indexOf('data-phase="p4-0"') >= 0 && h.indexOf('data-phase="f0"') < 0 && h.indexOf('data-ms="p4-0-m1"') >= 0 && h.indexOf('data-ms="f0-m1"') < 0, '4x4: the 4x4 plan with p4- milestone ids');
  check(h.indexOf('Phase 0 · Diagnosis') >= 0, '4x4: current phase is the first one');
  check(h.indexOf('plan-puzzle') >= 0 && h.indexOf('not enough solves') < 0, '4x4: 12 solves are enough for the ao12');
  // fewer than 12 solves of the puzzle in use: no ao12 even if the other puzzle has plenty
  ses.solves = solves.slice(0, 17); // 12 solves of 3x3 and only 5 of 4x4
  h = render();
  check(h.indexOf('not enough solves yet') >= 0, '4x4 with few 4x4 solves: no ao12 although there are 12 3x3 solves');
  sb.Puzzle.set('3x3');
  h = render();
  check(h.indexOf('<b>' + fmt(60000) + '</b>') >= 0, 'back in 3x3 mode the 3x3 ao12 is there');
  ses.solves = solves;
  // milestones: the p4- progress moves the current phase on, and 3x3 progress does not affect the 4x4 plan
  sb.Puzzle.set('4x4');
  miles = { 'f0-m1': true, 'f0-m2': true, 'f0-m3': true };
  h = render();
  check(h.indexOf('<b>Phase 0 · Diagnosis</b>') >= 0, '4x4: 3x3 milestones do not complete 4x4 phases');
  miles = { 'p4-0-m1': true, 'p4-0-m2': true, 'p4-0-m3': true };
  h = render();
  check(h.indexOf('<b>Phase 1 · Centers</b>') >= 0 && /data-ms="p4-0-m1" checked/.test(h), '4x4: finishing the p4-0 milestones moves the current phase to Phase 1');
  sb.Puzzle.set('3x3');
  h = render();
  check(h.indexOf('<b>Phase 0 · Diagnosis</b>') >= 0 && h.indexOf('Phase 1 · Fluency') >= 0, '3x3: its progress is untouched by the 4x4 milestones');
  // Spanish
  sb.I18N.setLang('es');
  sb.Puzzle.set('4x4');
  h = render();
  check(/Situación de Ana · <span class="plan-puzzle">4x4<\/span>/.test(h) && h.indexOf('Fase 1 · Centros') >= 0, 'es 4x4: situation card and plan in Spanish');
  sb.I18N.setLang('en');
  sb.Puzzle.set('3x3');
  // no Puzzle at all (old build): PlanView uses every solve
  delete sb.Puzzle;
  h = render();
  check(h.indexOf('data-phase="f0"') >= 0 && /plan-puzzle">3x3</.test(h), 'without Puzzle: the 3x3 plan and the 3x3 label');
})();

console.log(passed + ' ok, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
