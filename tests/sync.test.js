const vm = require('vm');
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
let fails = 0;
function ok(c, msg) { if (!c) { fails++; console.error('FALLA: ' + msg); } else console.log('ok  ' + msg); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach((k) => deepFreeze(o[k])); }
  return o;
}

// db en memoria: doc/collection/get/set/delete/limit/onSnapshot. Los snapshots son asíncronos tras cada
// escritura y llegan a todos los suscriptores (de cualquier "dispositivo" que comparta el mock).
function mockClaude(opts) {
  opts = opts || {};
  const store = new Map(); // path -> JSON
  const log = { sets: [], deletes: [], gets: 0, failSet: null };
  const subs = new Set();
  const seg = (p) => p.split('/').length;
  const state = { paused: false };
  const meta = () => ({ fromCache: false, hasPendingWrites: false });
  const snapOf = (p, v) => ({ id: p.split('/').pop(), exists: v !== undefined, data: () => (v === undefined ? undefined : deepFreeze(JSON.parse(v))), metadata: meta() });

  function colEntries(p) {
    const out = [];
    store.forEach((v, k) => { if (k.startsWith(p + '/') && seg(k) === seg(p) + 1) out.push([k, v]); });
    return out.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }
  function deliver(sub) {
    sub.timer = null;
    if (sub.dead || state.paused) { if (!sub.dead) sub.timer = 'paused'; return; }
    const cur = new Map(colEntries(sub.col));
    const changes = [];
    const docs = [];
    cur.forEach((v, k) => {
      const d = snapOf(k, v); docs.push(d);
      if (!sub.prev.has(k)) changes.push({ type: 'added', doc: d, oldIndex: -1, newIndex: docs.length - 1 });
      else if (sub.prev.get(k) !== v) changes.push({ type: 'modified', doc: d, oldIndex: docs.length - 1, newIndex: docs.length - 1 });
    });
    sub.prev.forEach((v, k) => { if (!cur.has(k)) changes.push({ type: 'removed', doc: snapOf(k, v), oldIndex: 0, newIndex: -1 }); });
    if (!changes.length && !sub.first) return;
    sub.first = false; sub.prev = cur;
    sub.next({ docs, size: docs.length, empty: !docs.length, docChanges: () => changes, metadata: meta() });
  }
  function kick(sub) { if (!sub.timer && !sub.dead) sub.timer = setTimeout(() => deliver(sub), 1); }
  function notify() { subs.forEach(kick); }

  function docRef(p) {
    return {
      id: p.split('/').pop(), path: p,
      async get() { log.gets++; return snapOf(p, store.get(p)); },
      async set(body) {
        if (log.failSet) { const f = log.failSet; log.failSet = null; throw f; }
        log.sets.push(p); store.set(p, JSON.stringify(body)); notify();
      },
      async delete() { log.deletes.push(p); store.delete(p); notify(); },
      collection(n) { return colRef(p + '/' + n); }
    };
  }
  function colRef(p) {
    const q = {
      path: p,
      doc: (id) => docRef(p + '/' + id),
      limit() { return q; },
      async get() {
        log.gets++;
        const docs = colEntries(p).map(([k, v]) => snapOf(k, v));
        return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: meta() };
      },
      onSnapshot(next, error) {
        const sub = { col: p, next, error, prev: new Map(), first: true, timer: null, dead: false };
        subs.add(sub); kick(sub);
        return () => { sub.dead = true; subs.delete(sub); };
      }
    };
    return q;
  }
  const db = { doc: docRef, collection: colRef };
  const claude = {
    use: async (n) => {
      if (opts.nullDb && n === 'db') return null;
      if (n === 'db') return db;
      if (n === 'user') return { id: async () => 'u1' };
      return null;
    }
  };
  return {
    claude, store, log, db,
    pause() { state.paused = true; },
    resume() { state.paused = false; subs.forEach((s) => { if (s.timer === 'paused') s.timer = null; kick(s); }); },
    subCount: () => subs.size,
    failSubs(code) { [...subs].forEach((s) => { s.dead = true; subs.delete(s); if (s.error) s.error({ code, message: 'x' }); }); }
  };
}

// Un "dispositivo": storage.js + sync.js en un navegador falso con su propio localStorage. seedLocal se escribe antes.
function boot(mock, seedLocal, noClaude) {
  const ls = {};
  if (seedLocal) ls['cubotrainer.v1'] = JSON.stringify(seedLocal);
  const dev = { busy: false };
  const sb = {
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } },
    setTimeout, clearTimeout, console, __SYNC_CFG: { debounce: 5, retryMin: 5, retryRange: 5, busyRetry: 20 },
    document: { visibilityState: 'visible', addEventListener() {} },
    App: { isBusy: () => dev.busy }
  };
  if (!noClaude) sb.claude = mock.claude;
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read('storage.js'), sb);
  dev.sb = sb;
  dev.S = sb.Storage;
  dev.replaces = 0;
  const orig = sb.Storage.replaceAll;
  sb.Storage.replaceAll = function () { dev.replaces++; return orig.apply(this, arguments); };
  dev.load = () => { vm.runInContext(read('sync.js'), sb); dev.sync = sb.Sync; return sb.Sync; };
  dev.ls = ls;
  return dev;
}
async function settle() {
  const devs = [...arguments];
  for (let i = 0; i < 5; i++) { await sleep(20); for (const d of devs) await d.sync.idle(); }
}

function mkSolves(n, pre) {
  const solves = [];
  for (let i = 0; i < n; i++) solves.push({ id: (pre || 'v') + i, time: 10000 + i, penalty: null, scramble: 'R U', date: 1000 + i });
  return solves;
}
function seed(n, sid) {
  sid = sid || 's1';
  return { sessions: [{ id: sid, name: 'S', created: 1, solves: mkSolves(n, sid === 's1' ? 'v' : sid + '-') }], activeSessionId: sid };
}
function seed2() { // dos perfiles: S (activo) y R
  return { sessions: [{ id: 'S', name: 'Sesión 1', created: 1, solves: mkSolves(3, 'S') }, { id: 'R', name: 'Papa', created: 2, solves: mkSolves(2, 'R') }], activeSessionId: 'S' };
}
const P = 'data/users/u1/meta';
const PR = P + '/profiles/', CH = P + '/chunks/';
const remoteDoc = (m, p) => (m.store.has(p) ? JSON.parse(m.store.get(p)) : undefined);
const prof = (d, id) => d.S.get().sessions.filter((s) => s.id === id)[0];
const remoteSolves = (m, id) => [...m.store.keys()].filter((k) => k.startsWith(CH + id + '_')).sort().reduce((a, k) => a.concat(JSON.parse(m.store.get(k)).solves), []);

(async () => {
  // (a) primer uso: un doc por perfil + trozos, sin activeSessionId ni meta antiguo
  {
    const m = mockClaude();
    const d = boot(m, seed(5));
    const Sync = d.load();
    await sleep(20); await Sync.idle();
    ok(Sync.status === 'synced', '(a) estado synced: ' + Sync.status);
    const pd = remoteDoc(m, PR + 's1');
    ok(pd && pd.id === 's1' && pd.name === 'S' && pd.settings && pd.trainer && pd.plan && pd.solves === undefined && pd.chunks === undefined, '(a) doc de perfil correcto');
    ok(m.store.has(CH + 's1_0') && JSON.parse(m.store.get(CH + 's1_0')).solves.length === 5, '(a) sube el trozo');
    ok(!m.store.has(P), '(a) no se crea el meta antiguo');
    ok(![...m.store.values()].some((v) => v.includes('activeSessionId')), '(a) sin activeSessionId en remoto');
  }
  // (b) 950 -> 3 trozos
  let m, b, Sync;
  {
    m = mockClaude();
    b = boot(m, seed(950));
    Sync = b.load();
    await sleep(20); await Sync.idle();
    const keys = [...m.store.keys()].filter((k) => k.includes('/chunks/'));
    ok(keys.length === 3, '(b) 950 resoluciones -> 3 trozos (' + keys.length + ')');
    const sizes = keys.sort().map((k) => JSON.parse(m.store.get(k)).solves.length);
    ok(sizes.join() === '400,400,150', '(b) tamaños 400,400,150: ' + sizes);
  }
  // (c) cambiar penalización de una resolución antigua: solo ese trozo
  {
    m.log.sets.length = 0;
    b.sb.Storage.activeSession().solves[10].penalty = '+2';
    b.sb.Storage.save();
    await sleep(30); await Sync.idle();
    const s = m.log.sets.slice();
    ok(s.length === 1 && s[0] === CH + 's1_0', '(c) reescribe solo el trozo 0: ' + s.join(','));
    ok(JSON.parse(m.store.get(CH + 's1_0')).solves[10].penalty === '+2', '(c) contenido actualizado');
  }
  // (d) borrar perfil borra su doc y sus trozos
  {
    const S = b.sb.Storage;
    S.newSession('Otra');
    await sleep(30); await Sync.idle();
    m.log.deletes.length = 0; m.log.sets.length = 0;
    S.deleteSession('s1');
    await sleep(30); await Sync.idle();
    ok(m.log.deletes.length === 4 && m.log.deletes.includes(PR + 's1'), '(d) borra doc + 3 trozos: ' + m.log.deletes.length);
    ok(![...m.store.keys()].some((k) => k.includes('/s1'))
      , '(d) no quedan doc ni trozos s1');
    ok(m.log.sets.length === 0, '(d) no reescribe nada más: ' + m.log.sets.join(','));
  }
  // (e) remoto existente + resolución local nueva hecha tras la carga
  {
    const m1 = mockClaude();
    const b1 = boot(m1, seed(3));
    const S1 = b1.load(); await sleep(20); await S1.idle();
    const local = seed(0, 'otra');
    const b2 = boot(m1, local);
    const S2 = b2.load();
    b2.sb.Storage.addSolve({ time: 7777, penalty: null, scramble: 'F', date: Date.now() + 5 });
    await sleep(40); await S2.idle();
    const all = b2.sb.Storage.get().sessions.reduce((a, s) => a.concat(s.solves), []);
    ok(all.length === 4 && all.some((x) => x.time === 7777) && all.some((x) => x.id === 'v0'), '(e) resultado contiene remoto + local nuevo (' + all.length + ')');
    const remoteTotal = remoteSolves(m1, 's1').length;
    ok(remoteTotal === 4, '(e) fusión escrita al remoto: ' + remoteTotal);
  }
  // (f) use -> null => local
  {
    const m2 = mockClaude({ nullDb: true });
    const b2 = boot(m2, seed(2));
    const S2 = b2.load(); await sleep(20);
    ok(S2.status === 'local', '(f) modo local con use null');
    b2.sb.Storage.save(); await sleep(20);
    ok(m2.log.sets.length === 0 && m2.log.gets === 0, '(f) sin llamadas a db');
    const b3 = boot(null, seed(2), true);
    const S3 = b3.load(); await sleep(5);
    ok(S3.status === 'local', '(f) sin window.claude => local');
  }
  // (g) unavailable -> un reintento
  {
    const m3 = mockClaude();
    const b3 = boot(m3, seed(2));
    const S3 = b3.load(); await sleep(20); await S3.idle();
    m3.log.sets.length = 0;
    m3.log.failSet = { code: 'unavailable', message: 'x' };
    b3.sb.Storage.addSolve({ time: 5, penalty: null, scramble: '', date: Date.now() });
    await sleep(60); await S3.idle();
    ok(S3.status === 'synced', '(g) tras reintento queda synced: ' + S3.status);
    ok(m3.log.sets.length === 1 && JSON.parse(m3.store.get(CH + 's1_0')).solves.length === 3, '(g) el set se repitió una vez y quedó guardado');
    m3.log.failSet = { code: 'quota_exceeded', message: 'q' };
    b3.sb.Storage.addSolve({ time: 6, penalty: null, scramble: '', date: Date.now() });
    await sleep(40); await S3.idle();
    ok(S3.status === 'error' && /Sin espacio/.test(S3.detail), '(g) quota_exceeded -> error con mensaje');
    m3.log.failSet = { code: 'revoked', message: 'r' };
    b3.sb.Storage.addSolve({ time: 7, penalty: null, scramble: '', date: Date.now() });
    await sleep(40); await S3.idle();
    ok(S3.status === 'local', '(g) revoked -> local');
  }
  // (h) migración desde meta v1 y v2: crea docs de perfil, el meta antiguo queda intacto
  {
    const m4 = mockClaude();
    const sol = (id) => ({ sessionId: id, k: 0, solves: [{ id: 'x' + id, time: 9000, penalty: null, scramble: 'R', date: 1 }] });
    const metaV1 = JSON.stringify({ v: 1, rev: 5, activeSessionId: 'a', settings: { phaseMode: 'cfop' }, trainer: { status: { 'eo-line': 'dominado' }, times: {} }, plan: { milestones: { m1: true } },
      sessions: [{ id: 'a', name: 'Hijo', created: 1, chunks: 1 }, { id: 'b', name: 'Papa', created: 2, chunks: 1 }] });
    m4.store.set(P, metaV1);
    m4.store.set(CH + 'a_0', JSON.stringify(sol('a')));
    m4.store.set(CH + 'b_0', JSON.stringify(sol('b')));
    const chunksBefore = m4.store.get(CH + 'a_0') + m4.store.get(CH + 'b_0');
    const b4 = boot(m4, null);
    const S4 = b4.load(); await sleep(40); await S4.idle();
    const ss = b4.sb.Storage.get().sessions;
    ok(ss.length === 2 && ss.every((x) => x.plan.milestones.m1 && x.trainer.status['eo-line'] === 'dominado' && x.settings.phaseMode === 'cfop'), '(h) v1: ambos perfiles heredan hitos, estado y ajustes');
    ok(ss[0].plan !== ss[1].plan && ss[0].plan.milestones !== ss[1].plan.milestones, '(h) v1: copias independientes');
    const pa = remoteDoc(m4, PR + 'a'), pb = remoteDoc(m4, PR + 'b');
    ok(pa && pb && pa.name === 'Hijo' && pb.name === 'Papa' && pa.plan.milestones.m1 && pb.plan.milestones.m1 && pa.settings.phaseMode === 'cfop' && pb.trainer.status['eo-line'] === 'dominado', '(h) v1: docs de perfil con los datos globales copiados');
    ok(m4.store.get(P) === metaV1, '(h) v1: el meta antiguo queda intacto');
    ok(m4.store.get(CH + 'a_0') + m4.store.get(CH + 'b_0') === chunksBefore && !m4.log.sets.some((p) => p.includes('/chunks/')), '(h) v1: los trozos no se reescriben');
    ok(S4.status === 'synced', '(h) v1: synced: ' + S4.status);
    // (i) marcar un hito en el perfil A reescribe solo el doc de A
    m4.log.sets.length = 0;
    b4.sb.Storage.setActive('a');
    b4.sb.Storage.setMilestone('m2', true);
    await sleep(40); await S4.idle();
    ok(m4.log.sets.length === 1 && m4.log.sets[0] === PR + 'a', '(i) solo reescribe el doc de A: ' + m4.log.sets.join(','));
    ok(remoteDoc(m4, PR + 'a').plan.milestones.m2 && !remoteDoc(m4, PR + 'b').plan.milestones.m2, '(i) B no cambia');
    ok(m4.store.get(P) === metaV1, '(i) el meta antiguo sigue intacto');

    // v2
    const m5 = mockClaude();
    const stt = { inspection: true, phaseMode: 'off', customPhases: '', hideTime: false, scrambleLength: 20, showNet: true };
    const metaV2 = JSON.stringify({ v: 2, rev: 9, activeSessionId: 'a', sessions: [
      { id: 'a', name: 'Hijo', created: 1, chunks: 1, settings: stt, trainer: { status: { x: 'dominado' }, times: {} }, plan: { milestones: { h1: true } } },
      { id: 'b', name: 'Papa', created: 2, chunks: 1, settings: Object.assign({}, stt, { inspection: false }), trainer: { status: {}, times: {} }, plan: { milestones: {} } }] });
    m5.store.set(P, metaV2);
    m5.store.set(CH + 'a_0', JSON.stringify(sol('a')));
    m5.store.set(CH + 'b_0', JSON.stringify(sol('b')));
    const b5 = boot(m5, null);
    const S5 = b5.load(); await sleep(40); await S5.idle();
    const qa = remoteDoc(m5, PR + 'a'), qb = remoteDoc(m5, PR + 'b');
    ok(qa && qb && qa.settings.inspection === true && qb.settings.inspection === false && qa.plan.milestones.h1 && !qb.plan.milestones.h1 && qa.trainer.status.x === 'dominado', '(h) v2: docs de perfil con los datos de cada perfil');
    ok(m5.store.get(P) === metaV2 && !m5.log.sets.some((p) => p.includes('/chunks/')), '(h) v2: meta y trozos intactos');
    ok(b5.sb.Storage.get().sessions.length === 2 && b5.sb.Storage.get().sessions[0].solves.length === 1 && S5.status === 'synced', '(h) v2: estado local correcto');
    // una vez hay perfiles, el meta se ignora aunque cambie
    m5.store.set(P, JSON.stringify({ v: 2, rev: 10, sessions: [{ id: 'zzz', name: 'Fantasma', created: 3, chunks: 0 }] }));
    const b6 = boot(m5, null);
    const S6 = b6.load(); await sleep(40); await S6.idle();
    ok(b6.sb.Storage.get().sessions.length === 2 && !b6.sb.Storage.get().sessions.some((s) => s.id === 'zzz'), '(h) con perfiles existentes el meta antiguo se ignora');
  }

  // ---------- dos dispositivos ----------
  // (j) el bug real: renombrar en uno y trabajar en otro (sin recargar) no se pisa
  {
    const mm = mockClaude();
    const d1 = boot(mm, seed2()); const s1 = d1.load();
    await sleep(20); await s1.idle();
    const d2 = boot(mm, seed2()); const s2 = d2.load();
    await settle(d1, d2);
    d2.S.setActive('R');
    // dispositivo 2 queda "desfasado" (no recibe snapshots) mientras el 1 renombra
    mm.pause();
    d1.S.renameSession('S', 'Mateo');
    await sleep(30); await s1.idle();
    d2.S.addSolve({ time: 4242, penalty: null, scramble: 'U', date: Date.now() });
    d2.S.setMilestone('m1', true);
    await sleep(30); await s2.idle();
    mm.log.sets.length = 0;
    mm.resume();
    await settle(d1, d2);
    const rs = remoteDoc(mm, PR + 'S'), rr = remoteDoc(mm, PR + 'R');
    ok(rs.name === 'Mateo', '(j) remoto: S conserva el nombre nuevo (' + rs.name + ')');
    ok(rr.plan.milestones.m1 && remoteSolves(mm, 'R').some((x) => x.time === 4242) && remoteSolves(mm, 'R').length === 3, '(j) remoto: R tiene la resolución y el hito');
    ok(prof(d1, 'S').name === 'Mateo' && prof(d2, 'S').name === 'Mateo', '(j) ambos dispositivos: S = Mateo');
    ok(prof(d1, 'R').plan.milestones.m1 && prof(d2, 'R').plan.milestones.m1 && prof(d1, 'R').solves.length === 3 && prof(d2, 'R').solves.length === 3, '(j) ambos dispositivos: R con hito y resolución');
    ok(mm.log.sets.length === 0, '(j) tras sincronizar nadie reescribe nada: ' + mm.log.sets.join(','));
    // variante simultánea (sin pausa)
    d1.S.renameSession('S', 'Mateo2');
    d2.S.setMilestone('m2', true);
    await settle(d1, d2);
    ok(remoteDoc(mm, PR + 'S').name === 'Mateo2' && remoteDoc(mm, PR + 'R').plan.milestones.m2 && prof(d2, 'S').name === 'Mateo2' && prof(d1, 'R').plan.milestones.m2, '(j) cambios simultáneos en perfiles distintos: ambos se conservan');
  }
  // (k) perfil nuevo en el 2 -> aparece en el 1 por snapshot; un cambio posterior del 1 no lo borra
  let mk, dk1, dk2;
  {
    mk = mockClaude();
    dk1 = boot(mk, seed2()); const s1 = dk1.load();
    await sleep(20); await s1.idle();
    dk2 = boot(mk, seed2()); const s2 = dk2.load();
    await settle(dk1, dk2);
    const np = dk2.S.newSession('Hermana');
    dk2.S.addSolve({ time: 1111, penalty: null, scramble: 'R', date: Date.now() });
    await settle(dk1, dk2);
    const seen = prof(dk1, np.id);
    ok(seen && seen.name === 'Hermana' && seen.solves.length === 1 && seen.solves[0].time === 1111, '(k) el 1 ve el perfil nuevo (con sus resoluciones) sin recargar');
    dk1.S.setActive('R');
    dk1.S.setMilestone('m9', true);
    await settle(dk1, dk2);
    ok(prof(dk1, np.id) && prof(dk2, np.id) && remoteDoc(mk, PR + np.id), '(k) el perfil nuevo sigue en el 1, el 2 y el remoto tras un cambio del 1');
    ok(prof(dk2, 'R').plan.milestones.m9, '(k) el cambio del 1 llega al 2');
    // (l) el 1 borra el perfil -> desaparece en el 2
    dk1.S.deleteSession(np.id);
    await settle(dk1, dk2);
    ok(!prof(dk2, np.id) && !prof(dk1, np.id) && !remoteDoc(mk, PR + np.id) && remoteSolves(mk, np.id).length === 0, '(l) el perfil borrado en el 1 desaparece en el 2 y en remoto');
    ok(dk2.S.get().sessions.length === 2, '(l) quedan los 2 perfiles originales en el 2');
  }
  // (m) cada dispositivo conserva su propio perfil activo
  {
    dk1.S.setActive('S'); dk2.S.setActive('R');
    await settle(dk1, dk2);
    dk1.S.renameSession('R', 'Papa (editado)');
    dk2.S.addSolve({ time: 999, penalty: null, scramble: '', date: Date.now() });
    await settle(dk1, dk2);
    dk1.S.setMilestone('mm', true);
    await settle(dk1, dk2);
    ok(dk1.S.get().activeSessionId === 'S' && dk2.S.get().activeSessionId === 'R', '(m) cada dispositivo conserva su perfil activo (' + dk1.S.get().activeSessionId + ',' + dk2.S.get().activeSessionId + ')');
    ok(prof(dk2, 'R').name === 'Papa (editado)' && prof(dk1, 'R').solves.some((x) => x.time === 999), '(m) los cambios cruzados llegaron');
    ok(![...mk.store.values()].some((v) => v.includes('activeSessionId')), '(m) el perfil activo nunca se escribe en remoto');
  }
  // (n) con la app ocupada, el snapshot remoto no repinta hasta que acaba
  {
    const mn = mockClaude();
    const e1 = boot(mn, seed2()); const t1 = e1.load();
    await sleep(20); await t1.idle();
    const e2 = boot(mn, seed2()); const t2 = e2.load();
    await settle(e1, e2);
    e2.busy = true;
    const before = e2.replaces;
    e1.S.renameSession('S', 'Cambiado');
    await sleep(80);
    ok(e2.replaces === before && prof(e2, 'S').name !== 'Cambiado', '(n) ocupado: no se llama a replaceAll');
    e2.busy = false;
    await sleep(60); await t2.idle();
    ok(e2.replaces === before + 1 && prof(e2, 'S').name === 'Cambiado', '(n) al dejar de estar ocupado se aplica una vez');
  }
  // (o) errores de suscripción
  {
    const mo = mockClaude();
    const e1 = boot(mo, seed2()); const t1 = e1.load();
    await sleep(20); await t1.idle();
    const e2 = boot(mo, seed2()); const t2 = e2.load();
    await settle(e1, e2);
    const n = mo.subCount();
    mo.failSubs('unavailable');
    ok(mo.subCount() === n - 4 || mo.subCount() === 0, '(o) suscripciones caídas');
    await sleep(60);
    ok(mo.subCount() === n, '(o) unavailable -> resuscripción de ambos dispositivos (' + mo.subCount() + ')');
    e1.S.renameSession('S', 'TrasReconexion');
    await settle(e1, e2);
    ok(prof(e2, 'S').name === 'TrasReconexion', '(o) tras resuscribirse llegan los cambios');
    mo.failSubs('revoked');
    await sleep(30);
    ok(t1.status === 'local' && t2.status === 'local', '(o) revoked -> modo local');
  }
  console.log(fails ? fails + ' fallos' : 'todo ok');
  process.exit(fails ? 1 : 0);
})();
