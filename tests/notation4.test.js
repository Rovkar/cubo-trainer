'use strict';
// Tests for the 4x4 section: js/cube3d.js (NxN engine + top view), js/notation4.js and the size switch of js/notation.js.
// Run: node tests/notation4.test.js
const path = require('path');
const J = (f) => path.join(__dirname, '..', 'js', f);
const Cube = require(J('cube.js'));
const Cube4 = require(J('cube4.js'));
const Cube3D = require(J('cube3d.js'));
const P = require(J('parity4.js'));
const ALGS3 = require(J('algs.js'));
const N4 = require(J('notation4.js'));
const NV = require(J('notation.js'));

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const VIEW = Cube3D.DEFAULT_VIEW;
const Y = () => Cube4.solved('yellowTop');
const A3 = (id) => ALGS3.filter((a) => a.id === id)[0].alg;

function dirOf(a) {
  if (a.kind === 'arc') return a.cw ? 'cw' : 'ccw';
  const dx = a.to[0] - a.from[0], dy = a.to[1] - a.from[1];
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? 'up' : 'down';
  return dx < 0 ? 'left' : 'right';
}
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left', cw: 'ccw', ccw: 'cw' };
function wellFormed(s) {
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(s))) {
    if (m[4] === '/') continue;
    if (m[1] === '/') { if (stack.pop() !== m[2]) return false; }
    else stack.push(m[2]);
  }
  return stack.length === 0 && s.indexOf('<svg') === 0 && /<\/svg>$/.test(s) && !/NaN|undefined|Infinity/.test(s);
}

// ---------------------------------------------------------------------------------------------
// 1. Engine-derived arrows on the 4x4 match Parity4.NOTATION 'expect'
// ---------------------------------------------------------------------------------------------
(function () {
  P.NOTATION.forEach((n) => {
    const c = n.check;
    [[c.move, c.expect], [c.move + "'", OPP[c.expect]]].forEach((pair) => {
      const on = Cube3D.arrows(pair[0], VIEW, Cube4).filter((a) => a.face === c.face);
      check(on.length > 0, pair[0] + ': arrows on face ' + c.face);
      on.forEach((a) => check(dirOf(a) === pair[1], pair[0] + ' on ' + c.face + ': expected ' + pair[1] + ', got ' + dirOf(a)));
    });
    const two = Cube3D.arrows(c.move + '2', VIEW, Cube4);
    check(two.length > 0 && two.every((a) => a.turns === 2), c.move + '2: arrows with turns 2');
    check(eq(two.map((a) => [a.face, a.kind]), Cube3D.arrows(c.move, VIEW, Cube4).map((a) => [a.face, a.kind])), c.move + '2: same arrows as the quarter turn');
    // one straight arrow per moving strip (a strip has 4 facelets) on every crossed visible face
    const mi = Cube4.moveInfo(c.move);
    const all = Cube3D.arrows(c.move, VIEW, Cube4);
    all.forEach((a) => { if (a.kind === 'line') check(a.stickers.length === 4, c.move + ': a strip has 4 facelets'); });
    ['F', 'U', 'R'].forEach((f) => {
      const lines = all.filter((a) => a.kind === 'line' && a.face === f);
      if (lines.length) check(lines.length === mi.layers.length, c.move + ': one line per moving layer on ' + f + ' (' + lines.length + ' vs ' + mi.layers.length + ')');
    });
  });
  // inner slice 2R: no arc (the right face does not turn), arrows only on the faces it crosses
  const a2 = Cube3D.arrows('2R', VIEW, Cube4);
  check(a2.every((a) => a.kind === 'line') && eq(a2.map((a) => a.face).sort(), ['F', 'U']), '2R: one straight arrow on F and one on U, no arc');
  // Rw: an arc on R plus two strips on F and on U
  const aw = Cube3D.arrows('Rw', VIEW, Cube4);
  check(aw.filter((a) => a.kind === 'arc').length === 1 && aw.filter((a) => a.kind === 'line').length === 4, 'Rw: one arc on R and 2+2 straight arrows');
  // the strips really follow the engine: the middle facelets of each strip move along the arrow (tangent dir3)
  const FACES = Cube4.FACES;
  const ids = () => { const s = {}; FACES.forEach((f) => { s[f] = []; for (let i = 0; i < 16; i++) s[f].push(f + i); }); return s; };
  let lineN = 0;
  ['R', 'U', 'F', '2R', '2L', 'Rw', 'Lw', 'Uw', 'x', 'y'].forEach((m) => [m, m + "'"].forEach((tok) => {
    const after = Cube4.applyAlg(ids(), tok);
    Cube3D.arrows(tok, VIEW, Cube4).forEach((a) => {
      if (a.kind !== 'line') return;
      lineN++;
      const id = a.face + a.stickers[1];
      let dest = null;
      FACES.forEach((f) => { for (let i = 0; i < 16; i++) if (after[f][i] === id) dest = [f, i]; });
      const p0 = Cube4.stickerGeom(a.face, a.stickers[1]).p, p1 = Cube4.stickerGeom(dest[0], dest[1]).p;
      const dot = (p1[0] - p0[0]) * a.dir3[0] + (p1[1] - p0[1]) * a.dir3[1] + (p1[2] - p0[2]) * a.dir3[2];
      check(dot > 0.5, tok + ' line on ' + a.face + ': the strip moves along the arrow (dot ' + dot.toFixed(2) + ')');
    });
  }));
  check(lineN > 40, 'strip arrows checked against real facelet movement (' + lineN + ')');
  // arcs: facelet 0 of the turning face really travels in the direction the arc says (on the screen)
  const scr = (f, i) => { const g = Cube4.stickerGeom(f, i); return Cube3D.project([g.p[0] + g.n[0] * 0.5, g.p[1] + g.n[1] * 0.5, g.p[2] + g.n[2] * 0.5], VIEW); };
  const ctr = (f) => { const g = Cube4.stickerGeom(f, 0); const n = g.n; return Cube3D.project([n[0] * 2, n[1] * 2, n[2] * 2], VIEW); };
  let arcN = 0;
  ['R', 'U', 'F', 'Rw', 'Uw', 'x', 'y'].forEach((m) => [m, m + "'"].forEach((tok) => {
    const after = Cube4.applyAlg(ids(), tok);
    Cube3D.arrows(tok, VIEW, Cube4).forEach((a) => {
      if (a.kind !== 'arc') return;
      arcN++;
      let dest = null;
      FACES.forEach((f) => { for (let i = 0; i < 16; i++) if (after[f][i] === a.face + '0') dest = [f, i]; });
      check(dest[0] === a.face, tok + ' arc on ' + a.face + ': facelet 0 stays on the face');
      const c = ctr(a.face), o = scr(a.face, 0), d = scr(dest[0], dest[1]);
      const cr = (o.x - c.x) * (d.y - c.y) - (o.y - c.y) * (d.x - c.x);
      check((cr > 0) === a.cw, tok + ' arc on ' + a.face + ': on-screen direction matches the facelet movement');
    });
  }));
  check(arcN >= 10, 'arcs checked against real facelet movement (' + arcN + ')');
})();

// ---------------------------------------------------------------------------------------------
// 2. SVG: well formed, role=img, sticker counts, 'after' diagrams = Cube4.applyAlg
// ---------------------------------------------------------------------------------------------
(function () {
  const tt = 'x "q" <y>';
  P.NOTATION.forEach((n) => {
    const m = n.move;
    const before = Cube3D.svg(Y(), { engine: Cube4, highlight: m, arrows: m, size: 170, title: tt });
    check(wellFormed(before) && /role="img"/.test(before) && /aria-label="/.test(before) && !/<y>/.test(before), m + ': before svg well formed, role=img, title escaped');
    check((before.match(/data-s="/g) || []).length === 48, m + ': 48 visible facelets (3 faces x 16)');
    const st = N4.afterState(m);
    check(eq(st, Cube4.applyAlg(Y(), m)), m + ': afterState = Cube4.applyAlg');
    const after = Cube3D.svg(st, { engine: Cube4, size: 170 });
    const re = /data-s="([UFR])(\d+)" fill="(#\w+)"/g;
    let mm, cnt = 0, ok = true;
    while ((mm = re.exec(after))) { cnt++; if (Cube4.COLORS[st[mm[1]][+mm[2]]] !== mm[3]) ok = false; }
    check(cnt === 48 && ok, m + ': the after diagram uses the stickers of Cube4.applyAlg');
    // the page contains exactly that after svg and a card for the move
    const html = N4.build('en');
    check(html.indexOf('data-move="' + m + '"') >= 0, m + ': card present');
    check(html.indexOf(Cube3D.svg(st, { engine: Cube4, size: 170, title: N4.STRINGS.en['n4.alt.after'].replace('{m}', m) })) >= 0, m + ': page has the after diagram');
    // highlight: layers that do not move are dimmed
    const hi = Cube4.moveInfo(m);
    const dimmed = (before.match(/opacity="0.5"/g) || []).length;
    let moving = 0;
    ['U', 'R', 'F'].forEach((f) => { for (let i = 0; i < 16; i++) if (hi.layers.indexOf(Cube4.stickerGeom(f, i).p[hi.axis]) >= 0) moving++; });
    check(dimmed === 48 - moving, m + ': highlight dims ' + (48 - moving) + ' facelets (got ' + dimmed + ')');
  });
  // every svg of the page is well formed
  ['en', 'es'].forEach((l) => {
    const html = N4.build(l);
    const svgs = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
    check(svgs.length > 40, l + ': page has many diagrams (' + svgs.length + ')');
    check(svgs.every(wellFormed), l + ': every svg of the page is well formed');
    check(svgs.every((s) => /role="img"/.test(s) && /aria-label="[^"]+"/.test(s)), l + ': every svg has role=img and a label');
  });
  // top view
  const v = Cube4.lastLayerView(P.caseState('pll-corners'), 'pll');
  const top = Cube3D.topSvg(v, 4, { colors: Cube4.COLORS, title: 'a "b"' });
  check(wellFormed(top) && /role="img"/.test(top), 'topSvg well formed');
  check((top.match(/data-t="/g) || []).length === 16 + 16, 'topSvg: 16 top stickers + 4 strips of 4');
  const want = [].concat(v.u, v.b, v.r, v.f, v.l);
  const got = (top.match(/data-t="[ubrfl]\d+"[^>]*fill="[^"]+"/g) || []).map((x) => x.match(/fill="([^"]+)"/)[1]);
  const order = (top.match(/data-t="([ubrfl]\d+)"/g) || []).map((x) => x.match(/"(.+)"/)[1]);
  check(order.length === 32 && new Set(order).size === 32, 'topSvg: 32 distinct cell ids');
  const byId = {};
  order.forEach((id, i) => { byId[id] = got[i]; });
  const wantById = {};
  ['u', 'b', 'r', 'f', 'l'].forEach((k) => v[k].forEach((c, i) => { wantById[k + i] = c === 'x' ? 'var(--hidden)' : Cube4.COLORS[c]; }));
  check(Object.keys(wantById).length === 32 && Object.keys(wantById).every((k) => byId[k] === wantById[k]) && want.length === 32, 'topSvg: colors follow lastLayerView');
  const gray = Cube3D.topSvg(Cube4.lastLayerView(P.caseState('oll-parity'), 'oll'), 4, { colors: Cube4.COLORS });
  check((gray.match(/var\(--hidden\)/g) || []).length > 0 && (gray.match(/#FFD500/g) || []).length > 0, 'OLL mask: gray and yellow stickers');
  check(wellFormed(Cube3D.topSvg(Cube.lastLayerView(Cube.solved('yellowTop'), 'pll'), 3)), 'topSvg also works for N = 3');
})();

// ---------------------------------------------------------------------------------------------
// 3. Texts: en/es parity, no placeholders left, every key used exists
// ---------------------------------------------------------------------------------------------
(function () {
  const en = N4.STRINGS.en, es = N4.STRINGS.es;
  const kEn = Object.keys(en).sort(), kEs = Object.keys(es).sort();
  check(eq(kEn, kEs), 'same n4.* keys in en and es (' + kEn.filter((k) => !(k in es)).concat(kEs.filter((k) => !(k in en))).join(',') + ')');
  kEn.forEach((k) => check(k.indexOf('n4.') === 0, 'prefix n4.: ' + k));
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join('');
  kEn.forEach((k) => { if (k in es) check(ph(en[k]) === ph(es[k]), 'same placeholders in en and es: ' + k); });
  kEn.forEach((k) => check(en[k] !== '' && es[k] !== '', 'no empty text: ' + k));
  ['en', 'es'].forEach((l) => {
    const html = N4.build(l);
    check(!/\{\w+\}/.test(html), l + ': no unresolved {placeholders}');
    check(!/n4\.[a-zA-Z]/.test(html.replace(/data-[\w-]+="[^"]*"/g, '')), l + ': no untranslated keys');
    check(!/undefined|NaN/.test(html), l + ': no undefined / NaN in the page');
  });
  check(N4.build('en') !== N4.build('es') && N4.build('en') === N4.build('en'), 'en differs from es, build is cached');
  // the warning about r vs 2R is there, in both languages, and no algorithm shown uses an ambiguous lowercase token or M
  ['en', 'es'].forEach((l) => {
    const html = N4.build(l);
    check(/n4-warn/.test(html) && /Rw/.test(html) && /2R/.test(html), l + ': r vs 2R warning present');
    const algs = (html.match(/data-(?:step-)?alg4?="[^"]*"/g) || []).map((a) => a.replace(/^[^"]*"|"$/g, ''));
    check(algs.length > 10, l + ': algorithms present (' + algs.length + ')');
    algs.forEach((a) => check(!/(^|\s)[rludfb]['2]?(\s|$)/.test(a) && !/(^|\s)M/.test(a), l + ': no lowercase/M token in ' + a));
  });
  // every text key a page element can ask for exists (hold predicates, algs, sets)
  P.CASES.forEach((c) => c.steps.concat(c.shortcut || []).forEach((s) => {
    if (s.when) check(('n4.step.hold.' + s.when) in en, 'text for hold ' + s.when);
    if (s.hold) check(('n4.step.hold.' + s.hold) in en, 'text for hold ' + s.hold);
    if (s.do === 'then') check(('n4.step.then.' + s.case) in en, 'text for then ' + s.case);
    if (s.do === 'then3x3') check(('n4.step.3x3.' + s.set) in en, 'text for 3x3 step ' + s.set);
  }));
  check('n4.step.hold.solvedEdgeBack' in en, 'text for the EP hold');
  P.CASES.forEach((c) => {
    ['title', 'rec'].forEach((k) => check(('n4.c.' + c.id + '.' + k) in en, 'case text ' + c.id + '.' + k));
    check(('n4.par.which.' + c.id) in en && ('n4.cap.' + c.mask) in en && ('n4.tag.' + c.step) in en, 'summary/caption/tag texts for ' + c.id);
    (c.pre || []).forEach((p) => check(('n4.pre.' + p) in en, 'precondition text ' + p));
  });
  P.NOTATION.forEach((n) => ['name', 'x', 'xp', 'x2'].forEach((k) => check(('n4.m.' + n.move + '.' + k) in en, 'move text ' + n.move + '.' + k)));
})();

// ---------------------------------------------------------------------------------------------
// 4. Case cards show exactly the algorithms of Parity4.CASES, in recipe order
// ---------------------------------------------------------------------------------------------
(function () {
  // expected algorithm list, written independently of the view: walk the data
  function expected(steps) {
    const out = [];
    steps.forEach((s) => {
      if (s.do === 'alg') out.push(s.alg);
      else if (s.do === 'then') expected(P.caseById(s.case).steps).forEach((a) => out.push(a));
      else if (s.do === 'then3x3' && s.set === 'EPany') out.push({ any: s.algs.map((id) => P.to4x4(A3(id))) });
      else if (s.do === 'then3x3' && s.set !== 'OCLL') out.push(P.to4x4(A3(s.algs[0])));
    });
    return out;
  }
  const attrs = (html) => (html.match(/data-step-alg="[^"]*"/g) || []).map((a) => a.replace(/^data-step-alg="|"$/g, ''));
  ['en', 'es'].forEach((l) => {
    const html = N4.build(l);
    P.CASES.forEach((c) => {
      const i = html.indexOf('<article class="card n4-case" data-case="' + c.id + '">');
      check(i >= 0, l + ': card for ' + c.id);
      const j = html.indexOf('</article>', i);
      const card = html.slice(i, j);
      const sc = card.indexOf('<details class="n4-shortcut">');
      const mainPart = sc >= 0 ? card.slice(0, sc) : card;
      const shortPart = sc >= 0 ? card.slice(sc) : '';
      const got = attrs(mainPart);
      const want = expected(c.steps);
      check(got.length === want.length && got.every((g, i) => (typeof want[i] === 'string' ? g === want[i] : want[i].any.indexOf(g) >= 0)), l + ': ' + c.id + ' steps show exactly the recipe algorithms (' + got.length + ')');
      if (c.shortcut) check(eq(attrs(shortPart), expected(c.shortcut)), l + ': ' + c.id + ' shortcut shows exactly its algorithms');
      else check(sc < 0, l + ': ' + c.id + ' has no shortcut block');
      // the big block is the parity algorithm of the case
      const big = (card.match(/data-alg="([^"]*)"/) || [])[1];
      check(big === (c.id === 'oll-parity' ? P.ALGS.OLL_PARITY : P.ALGS.PLL_PARITY), l + ': ' + c.id + ' big block is the parity algorithm');
      // number of steps = number of walked recipe steps
      check((mainPart.match(/<li class="n4-step"/g) || []).length === N4.stepsFor(c.id, 'steps').length, l + ': ' + c.id + ' step count');
    });
  });
})();

// ---------------------------------------------------------------------------------------------
// 5. The recipes really solve the cases (the data the cards are drawn from), including the claims in the texts
// ---------------------------------------------------------------------------------------------
(function () {
  P.CASES.forEach((c) => ['steps', 'shortcut'].forEach((w) => {
    if (w === 'shortcut' && !c.shortcut) return;
    const items = N4.stepsFor(c.id, w);
    const last = items[items.length - 1].state;
    check(Cube4.isSolved(last), c.id + ' ' + w + ': the walked recipe ends solved');
    check(items.every((it) => it.state && it.state.U && it.state.U.length === 16), c.id + ' ' + w + ': every step carries its state');
    check(items[0].kind === 'hold' || items[0].kind === '3x3', c.id + ' ' + w + ': starts with a hold or the normal 3x3 step');
  }));
  // text claims
  const aufs = (id) => N4.stepsFor(id, 'steps').filter((it) => it.kind === 'auf').map((it) => it.alg);
  check(eq(aufs('pll-opposite'), ['U2']) && eq(aufs('pll-corners'), ['U2']), 'AUF of the PLL recipes is U2 in the case states');
  // pll-opposite: every valid hold gives AUF U2 (corners solved first)
  const opp = P.caseState('pll-opposite');
  P.holds(opp, 'swappedEdgesFrontBack').forEach((k) => {
    check(P.aufSolve(Cube4.applyAlg(P.rotateY(opp, k), P.ALGS.PLL_PARITY)) === 'U2', 'pll-opposite hold y^' + k + ': AUF = U2');
  });
  // pll-adjacent: after parity + U2, the solved edge at the back and Ub solves it with no final AUF; Ua never does
  const adj = N4.stepsFor('pll-adjacent', 'steps');
  const ub = adj[adj.length - 1];
  check(ub.kind === '3x3' && ub.hold === 'solvedEdgeBack' && eq(ub.ids, ['ep-ub']), 'pll-adjacent ends with the Ub, solved edge at the back');
  const preUb = adj[adj.length - 2].state;
  const ks = [0, 1, 2, 3].filter((k) => { const e = P.analyze(P.rotateY(preUb, k)).edges[2]; return e.paired && e.home === 2 && e.oriented; });
  check(ks.length === 1, 'pll-adjacent: exactly one hold puts the solved edge at the back (' + ks + ')');
  check(Cube4.isSolved(Cube4.applyAlg(P.rotateY(preUb, ks[0]), A3('ep-ub'))), 'pll-adjacent: Ub from that hold solves it with no AUF');
  let uaSolves = false;
  [0, 1, 2, 3].forEach((k) => { if (P.aufSolve(Cube4.applyAlg(P.rotateY(preUb, k), A3('ep-ua'))) !== null) uaSolves = true; });
  check(!uaSolves, 'pll-adjacent: the Ua never solves it (the text says so)');
  // oll-parity: from odd states (1 or 3 flipped dedges) one run leaves an even number (0 = cross done, 2 = a normal line / L)
  const flipped = (st) => P.analyze(st).edges.filter((e) => !e.oriented).length;
  const line = Cube4.applyAlg(Y(), "F R U R' U' F'");            // a line: two flipped dedges
  const L = Cube4.applyAlg(Y(), "F U R U' R' F'");               // another two-flipped state
  check(flipped(line) === 2 && flipped(L) === 2, 'both start with two flipped dedges');
  [Cube4.applyAlg(Y(), P.ALGS.OLL_PARITY), Cube4.applyAlg(line, P.ALGS.OLL_PARITY), Cube4.applyAlg(L, P.ALGS.OLL_PARITY)].forEach((st, i) => {
    const ks2 = P.holds(st, 'frontEdgeFlipped');
    check(flipped(st) % 2 === 1 && ks2.length > 0 && P.classify(st) === 'oll-parity', 'odd state ' + i + ' (' + flipped(st) + ' flipped) is recognized as OLL parity');
    ks2.forEach((k) => {
      const after = Cube4.applyAlg(P.rotateY(st, k), P.ALGS.OLL_PARITY);
      check(flipped(after) === flipped(st) - 1 && flipped(after) % 2 === 0, 'odd state ' + i + ' hold y^' + k + ': ' + flipped(st) + ' flipped -> ' + flipped(after));
    });
  });
  // pll-corners: the photographed state follows both flows (the texts' headlights wording)
  const photo = {};
  const col = { U: 'y', D: 'w', F: 'r', B: 'o', R: 'g', L: 'b' };
  Cube4.FACES.forEach((f) => { photo[f] = new Array(16).fill(col[f]); });
  photo.F[0] = 'g'; photo.L[3] = 'r'; photo.F[3] = 'b'; photo.R[0] = 'r';
  check(P.classify(photo) === 'pll-corners' && P.holds(photo, 'headlightsFrontOrBack').length === 2 && P.holds(photo, 'headlightsLeft').length === 1, 'photographed state: headlights at the back, one hold puts them on the left');
})();

// ---------------------------------------------------------------------------------------------
// 6. Size switch of the Notation tab (no DOM: a fake element + a localStorage stub)
// ---------------------------------------------------------------------------------------------
(function () {
  check(NV.size() === '3x3', 'default size is 3x3');
  NV.setSize('5x5');
  check(NV.size() === '3x3', 'invalid size ignored');
  // MOVES/build unchanged for 3x3
  check(NV.MOVES.length === 9 && NV.build('en').indexOf('data-move="Rw"') < 0, '3x3 build unchanged (no 4x4 cards)');
  const store = {};
  global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  global.Notation4View = N4;
  const el = { innerHTML: '', classList: { add() {} }, addEventListener() {} };
  NV.mount(el);
  check(/data-size="3x3"[^>]*aria-pressed="true"/.test(el.innerHTML) && /data-size="4x4"[^>]*aria-pressed="false"/.test(el.innerHTML), 'switch shows 3x3 pressed');
  check(el.innerHTML.indexOf('data-move="Rw"') < 0 && el.innerHTML.indexOf('data-move="D"') >= 0, '3x3 content by default');
  NV.setSize('4x4');
  check(store['cubotrainer.ntSize'] === '4x4', 'size persisted in cubotrainer.ntSize');
  check(/data-size="4x4"[^>]*aria-pressed="true"/.test(el.innerHTML) && el.innerHTML.indexOf('data-move="Rw"') >= 0 && el.innerHTML.indexOf('data-case="pll-corners"') >= 0, '4x4 content after setSize');
  check(el.innerHTML.indexOf(N4.build('en')) >= 0, 'render embeds Notation4View.build(lang)');
  NV.setSize('3x3');
  check(store['cubotrainer.ntSize'] === '3x3' && el.innerHTML.indexOf('data-move="Rw"') < 0, 'back to 3x3');
  delete global.localStorage; delete global.Notation4View;
  // a throwing localStorage never breaks setSize
  global.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  NV.setSize('4x4');
  check(NV.size() === '4x4', 'setSize works when localStorage throws');
  NV.setSize('3x3');
  delete global.localStorage;
})();

// ---------------------------------------------------------------------------------------------
// 7. The Trainer algorithms on a 4x4: the card, the 4x4 forms inside the recipes, the new case, the text variants
// ---------------------------------------------------------------------------------------------
(function () {
  const cardOf = (html, id) => {
    const i = html.indexOf('<article class="card n4-case" data-case="' + id + '">');
    return i < 0 ? '' : html.slice(i, html.indexOf('</article>', i));
  };
  const alg4s = (s) => (s.match(/data-alg4="[^"]*"/g) || []).map((a) => a.replace(/^data-alg4="|"$/g, ''));
  const changed = P.TRAINER.filter((x) => x.changed);
  check(changed.length === 6, 'six Trainer algorithms need a 4x4 version');
  ['en', 'es'].forEach((l) => {
    const html = N4.build(l);
    const i = html.indexOf('<section class="card n4-tr"');
    check(i >= 0, l + ': the Trainer-on-4x4 card exists');
    const card = html.slice(i, html.indexOf('</section>', i));
    const ids = (card.match(/<li data-id="[^"]+"/g) || []).map((x) => x.replace(/^<li data-id="|"$/g, ''));
    check(eq(ids, changed.map((x) => x.id)), l + ': the card lists exactly the six changed algorithms (' + ids.join(',') + ')');
    check(eq(alg4s(card), changed.map((x) => x.alg4)), l + ': the card shows their 4x4 forms');
    const old = (card.match(/data-alg3="[^"]*"/g) || []).map((a) => a.replace(/^data-alg3="|"$/g, ''));
    check(eq(old, changed.map((x) => x.alg3)), l + ': the card also shows the Trainer (3x3) versions');
    check(/3Rw/.test(card) && /3Fw/.test(card) && card.indexOf("2L 2R'") >= 0 && card.indexOf('2L2 2R2') >= 0, l + ': the card explains r, f and M');
    check(card.indexOf(N4.STRINGS[l]['n4.tr.same'].replace('{n}', String(P.TRAINER.length - changed.length))) >= 0 && P.TRAINER.length - changed.length === 10, l + ': the card says that the other 10 work as they are');
    // the old promise is gone
    check(!/same algorithms|mismos algoritmos/i.test(html) && !/con los mismos|with the same algorithms/i.test(html), l + ': no claim that the 3x3 algorithms work unchanged');
    // 3Rw and 3Fw have cards in the notation part
    check(html.indexOf('data-move="3Rw"') >= 0 && html.indexOf('data-move="3Fw"') >= 0, l + ': notation cards for 3Rw and 3Fw');
    // the OLL parity card lists the 4x4 forms of the L shape and the dot, and the OCLL step those of T and L
    const oll = cardOf(html, 'oll-parity');
    check(eq(alg4s(oll), [P.trainerAlg('eo-l').alg4, P.trainerAlg('eo-dot').alg4, P.trainerAlg('ocll-t').alg4, P.trainerAlg('ocll-l').alg4]), l + ': oll-parity card: 4x4 forms of eo-l, eo-dot, ocll-t, ocll-l');
    check(oll.indexOf('data-step-alg="' + P.ALGS.OLL_PARITY + '"') >= 0, l + ': oll-parity card still shows the parity algorithm in its steps');
    // no data-step-alg / data-alg4 / data-alg anywhere has an ambiguous token or M
    const all = (html.match(/data-(?:step-)?alg4?="[^"]*"/g) || []).map((a) => a.replace(/^[^"]*"|"$/g, ''));
    all.forEach((a) => check(!/(^|\s)[rludfbM]['2]?(\s|$)/.test(a), l + ': no lowercase/M token in ' + a));
    // the new case
    const cyc = cardOf(html, 'pll-cycle');
    check(cyc.length > 0 && cyc.indexOf('data-alg="' + P.ALGS.PLL_PARITY + '"') >= 0, l + ': pll-cycle card with the PLL parity algorithm');
    check(N4.stepsFor('pll-cycle', 'steps').map((it) => it.kind).join() === 'hold,alg,alg,3x3', l + ': pll-cycle steps: hold, parity, U2, normal step 4');
    // text variants of the PLL parity step
    const T = (k) => N4.STRINGS[l][k];
    const main = (id) => { const c = cardOf(html, id), s = c.indexOf('<details class="n4-shortcut">'); return s >= 0 ? c.slice(0, s) : c; };
    const short = (id) => { const c = cardOf(html, id), s = c.indexOf('<details class="n4-shortcut">'); return s >= 0 ? c.slice(s) : ''; };
    const has = (part, key) => part.indexOf(T(key).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')) >= 0;
    check(has(main('pll-opposite'), 'n4.step.alg.pll') && has(main('pll-corners'), 'n4.step.alg.pll'), l + ': opposite swap and corner main flow use the generic PLL step text');
    check(has(main('pll-adjacent'), 'n4.step.alg.pll.adj') && !has(main('pll-adjacent'), 'n4.step.alg.pll'), l + ': pll-adjacent has its own PLL step text');
    check(has(short('pll-corners'), 'n4.step.alg.pll.short'), l + ': the shortcut has its own PLL step text');
    check(has(main('pll-cycle'), 'n4.step.alg.pll.any') && has(main('pll-cycle'), 'n4.step.hold.anyHold'), l + ': pll-cycle step texts');
    check(!/swaps the front and back dedges and also turns|Intercambia las aristas dobles de delante y de atrás y además/.test(html), l + ': the old PLL step sentence is gone');
    // the recognition sentence of the OLL parity says 1 or 3
    check(/1 (or|o) 3/.test(T('n4.c.oll-parity.rec')) && !/one dedge is flipped|una arista doble está volteada/.test(T('n4.c.oll-parity.rec')), l + ': oll-parity recognition says an odd number (1 or 3)');
    // every 4x4 text key used for the new parts exists in both languages
    ['n4.tr.title', 'n4.tr.lead', 'n4.tr.map.r', 'n4.tr.map.f', 'n4.tr.map.M', 'n4.tr.same', 'n4.step.hold.anyHold', 'n4.step.3x3.EPany', 'n4.c.pll-cycle.title', 'n4.c.pll-cycle.rec', 'n4.par.which.pll-cycle',
      'n4.kind.wide3.title', 'n4.kind.wide3.text', 'n4.m.3Rw.name', 'n4.m.3Rw.x', 'n4.m.3Fw.x2', 'n4.step.3x3.OCLL.alg4', 'n4.c.oll-parity.alg4'].forEach((k) => check(!!N4.STRINGS.en[k] && !!N4.STRINGS.es[k], 'text ' + k));
  });
  // the page text that tells the user about r/f/M also says it in the flow list and the intro
  check(/3Rw|r, f or M/.test(N4.STRINGS.en['n4.flow.2']) && /r, f o M/.test(N4.STRINGS.es['n4.flow.2']), 'flow step 2 warns about r, f and M in both languages');
  // pll-cycle: texts and data agree on what happens (one run explored per hold is in parity.test.js)
  check(P.classify(P.caseState('pll-cycle')) === 'pll-cycle', 'pll-cycle case state is classified as pll-cycle');
})();

// ---------------------------------------------------------------------------------------------
// 8. Size switch: keyboard focus survives the re-render, one listener however many times it is mounted
// ---------------------------------------------------------------------------------------------
(function () {
  const store = {};
  global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  global.Notation4View = N4;
  const calls = { listeners: 0, focused: [] };
  let handler = null;
  const el2 = {
    innerHTML: '', classList: { add() {} },
    addEventListener(type, h) { calls.listeners++; handler = h; },
    querySelector(sel) { const m = /data-size="([^"]+)"/.exec(sel); return m ? { focus() { calls.focused.push(m[1]); } } : null; },
  };
  NV.setSize('3x3');
  NV.mount(el2); NV.mount(el2); NV.mount(el2);
  check(calls.listeners === 1, 'mount called three times adds a single click listener (' + calls.listeners + ')');
  handler({ target: { closest: () => ({ getAttribute: () => '4x4' }) } });
  check(NV.size() === '4x4' && el2.innerHTML.indexOf('data-move="Rw"') >= 0, 'a click on the selector switches to 4x4');
  check(eq(calls.focused, ['4x4']), 'the 4x4 button gets the focus back after the re-render');
  handler({ target: { closest: () => ({ getAttribute: () => '3x3' }) } });
  check(eq(calls.focused, ['4x4', '3x3']) && NV.size() === '3x3', 'and so does the 3x3 button');
  NV.setSize('4x4');
  check(calls.focused.length === 2, 'a programmatic change (the Trainer button) does not steal the focus');
  handler({ target: { closest: () => null } });
  check(calls.focused.length === 2, 'a click elsewhere does nothing');
  NV.setSize('3x3');
  delete global.localStorage; delete global.Notation4View;
})();

console.log(passed + ' ok, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
