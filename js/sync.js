(function (root) {
  'use strict';
  // Sincronización v3: un documento por perfil + trozos de resoluciones, escritura solo de lo que
  // cambió en este dispositivo y cambios del otro dispositivo en vivo con onSnapshot.
  //   data/users/<uid>/meta/profiles/<perfilId>  -> { id, name, created, settings, trainer, plan }
  //   data/users/<uid>/meta/chunks/<perfilId>_<k> -> { sessionId, k, solves }
  // El perfil activo (activeSessionId) es de cada dispositivo y nunca se escribe en remoto.
  // El documento "meta" de las versiones 1 y 2 solo se lee (migración) y no se modifica jamás.
  var CHUNK_SIZE = 400;
  var ERR_LOCAL = { revoked: 1, not_granted: 1, capability_disabled: 1, capability_removed: 1 };

  // JSON canónico (claves ordenadas): compara cuerpos sin depender del orden de claves
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(function (x) { return x === undefined ? 'null' : canon(x); }).join(',') + ']';
    var ks = Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort();
    return '{' + ks.map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
  }
  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }

  function create(env) {
    var cfg = Object.assign({ debounce: 700, retryMin: 1000, retryRange: 1000, busyRetry: 1000 }, env.__SYNC_CFG || {});
    var Storage = env.Storage;
    var pageLoadTime = Date.now();
    var status = 'connecting', detail = '';
    var listeners = [];
    var mode = 'connecting'; // connecting | db | local
    var db = null, metaRef = null, profRef = null, chunksRef = null;
    var lastSynced = {};  // path -> JSON canónico del último cuerpo conocido en el servidor (base para detectar cambios locales)
    var remote = {};      // path -> { key, body } último estado observado del servidor (lecturas y snapshots)
    var writing = {}, touched = {};
    var timer = null, flushing = false, dirty = false, applyTimer = null;
    var unsubs = [], resubscribed = false;

    function setStatus(s, d) {
      status = s; detail = d || '';
      api.status = s; api.detail = detail;
      listeners.slice().forEach(function (fn) { try { fn(s, detail); } catch (e) { /* ignorar */ } });
    }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function unsubscribeAll() {
      unsubs.forEach(function (u) { try { u(); } catch (e) { /* ignorar */ } });
      unsubs = [];
    }
    function goLocal() {
      mode = 'local';
      if (timer) { clearTimeout(timer); timer = null; }
      if (applyTimer) { clearTimeout(applyTimer); applyTimer = null; }
      unsubscribeAll();
      setStatus('local');
    }
    function handleError(e) {
      var code = e && e.code;
      if (ERR_LOCAL[code]) return goLocal();
      if (code === 'quota_exceeded') return setStatus('error', env.I18N ? env.I18N.t('sync.quota') : 'Sin espacio de almacenamiento: exporta una copia y borra perfiles o resoluciones antiguas');
      setStatus('error', (e && e.message) || String(e));
    }

    // ---------- modelo de documentos ----------
    function chunkPid(path) { // id de perfil si el path es un trozo, si no null
      var pre = chunksRef.path + '/';
      if (path.indexOf(pre) !== 0) return null;
      var id = path.slice(pre.length), i = id.lastIndexOf('_');
      return i < 0 ? null : id.slice(0, i);
    }
    function isProfilePath(path) { return path.indexOf(profRef.path + '/') === 0; }

    function chunkize(pid, solves) {
      var docs = {}, n = 0;
      for (var i = 0; i < solves.length; i += CHUNK_SIZE, n++) {
        docs[chunksRef.path + '/' + pid + '_' + n] = { sessionId: pid, k: n, solves: solves.slice(i, i + CHUNK_SIZE) };
      }
      return docs;
    }
    function localDocsOf(data) {
      var docs = {};
      data.sessions.forEach(function (s) {
        docs[profRef.path + '/' + s.id] = { id: s.id, name: s.name, created: s.created, settings: s.settings, trainer: s.trainer, plan: s.plan };
        var c = chunkize(s.id, s.solves || []);
        Object.keys(c).forEach(function (p) { docs[p] = c[p]; });
      });
      return docs;
    }
    function localDocs() { return localDocsOf(Storage.get()); }

    // Reconstruye el estado local a partir de perfiles (con o sin campo chunks) y trozos
    function fromRemote(meta, chunkDocs) {
      meta = clone(meta); chunkDocs = clone(chunkDocs);
      var by = {};
      chunkDocs.forEach(function (c) { (by[c.sessionId] = by[c.sessionId] || []).push(c); });
      var sessions = (meta.sessions || []).map(function (s) {
        var list = (by[s.id] || []).sort(function (a, b) { return a.k - b.k; });
        var solves = [];
        list.forEach(function (c) { solves = solves.concat(c.solves || []); });
        var o = { id: s.id, name: s.name, created: s.created, solves: solves };
        if (s.settings) o.settings = s.settings;
        if (s.trainer) o.trainer = s.trainer;
        if (s.plan) o.plan = s.plan;
        return o;
      });
      var out = { sessions: sessions, activeSessionId: meta.activeSessionId };
      if (meta.v === 1 || (meta.v === undefined && meta.settings)) { out.settings = meta.settings; out.trainer = meta.trainer; out.plan = meta.plan; } // v1: Storage.normalize migra
      return out;
    }

    // El perfil activo es de cada dispositivo: si el local existe en el estado nuevo, se conserva
    function keepLocalActive(state) {
      var localId = Storage.get().activeSessionId;
      if (state.sessions.some(function (s) { return s.id === localId; })) state.activeSessionId = localId;
    }

    function setRemote(path, body) { remote[path] = { key: canon(body), body: body }; }
    function setSynced(path, key) { if (key === undefined) delete lastSynced[path]; else lastSynced[path] = key; }

    function hasPending() {
      var docs = localDocs(), p;
      for (p in docs) if (lastSynced[p] !== canon(docs[p])) return true;
      for (p in lastSynced) if (!docs[p]) return true;
      return false;
    }

    // ---------- carga inicial ----------
    function mergeLocalNew(state) {
      // Fusiona lo creado localmente desde que cargó la página (aún no estaba en remoto)
      var present = {}, merged = false;
      state.sessions.forEach(function (s) { s.solves.forEach(function (x) { present[x.id] = true; }); });
      Storage.get().sessions.forEach(function (ls) {
        (ls.solves || []).forEach(function (x) {
          if (x.date >= pageLoadTime && !present[x.id]) {
            var target = state.sessions.filter(function (s) { return s.id === ls.id; })[0] ||
              state.sessions.filter(function (s) { return s.id === state.activeSessionId; })[0] || state.sessions[0];
            if (target) { target.solves.push(clone(x)); present[x.id] = true; merged = true; }
          }
        });
      });
      return merged;
    }

    async function initialLoad() {
      remote = {}; lastSynced = {};
      var ps = await profRef.limit(1000).get();
      var profBodies = ps.docs.map(function (d) { return d.data(); });
      var state, cs, metaV = 0;

      if (profBodies.length) {
        cs = await chunksRef.limit(1000).get();
        var cb = cs.docs.map(function (d) { return d.data(); });
        state = fromRemote({ v: 3, sessions: profBodies }, cb);
        ps.docs.forEach(function (d) { setRemote(profRef.path + '/' + d.id, d.data()); lastSynced[profRef.path + '/' + d.id] = remote[profRef.path + '/' + d.id].key; });
        var known = {};
        state.sessions.forEach(function (s) { known[s.id] = true; });
        cs.docs.forEach(function (d) {
          var p = chunksRef.path + '/' + d.id;
          setRemote(p, d.data());
          // Los trozos huérfanos (su perfil aún no llegó) solo se cachean: no son nuestros para borrarlos
          if (known[chunkPid(p)]) lastSynced[p] = remote[p].key;
        });
      } else {
        var ms = await metaRef.get();
        if (!ms.exists) { // primer uso: se sube el estado local
          mode = 'db';
          subscribe();
          schedule(0);
          return;
        }
        // Migración desde el meta antiguo (v1/v2): solo se lee, nunca se modifica
        var meta = ms.data();
        metaV = meta.v;
        cs = await chunksRef.limit(1000).get();
        state = fromRemote(meta, cs.docs.map(function (d) { return d.data(); }));
        var ids = {};
        state.sessions.forEach(function (s) { ids[s.id] = true; });
        cs.docs.forEach(function (d) {
          var p = chunksRef.path + '/' + d.id;
          setRemote(p, d.data());
          if (ids[chunkPid(p)]) lastSynced[p] = remote[p].key;
        });
        // Los documentos de perfil no existen aún: no están en lastSynced, así que flush los crea
      }
      mergeLocalNew(state);
      mode = 'db';
      keepLocalActive(state);
      Storage.replaceAll(state, { silent: true });
      subscribe();
      if (hasPending()) schedule(0); else setStatus('synced');
    }

    // ---------- escritura ----------
    function schedule(ms) {
      if (mode !== 'db') return;
      if (flushing) { dirty = true; return; }
      if (timer) clearTimeout(timer);
      setStatus('saving');
      timer = setTimeout(function () { timer = null; flush(); }, ms === undefined ? cfg.debounce : ms);
    }

    async function writeDoc(p, body, key) {
      writing[p] = true; touched[p] = false;
      try { await db.doc(p).set(body); }
      finally { writing[p] = false; }
      lastSynced[p] = key;
      if (!touched[p]) remote[p] = { key: key, body: clone(body) };
      else scheduleApply(); // llegó otra versión mientras escribíamos: se reconcilia
    }
    async function deleteDoc(p) {
      writing[p] = true; touched[p] = false;
      try { await db.doc(p).delete(); }
      finally { writing[p] = false; }
      delete lastSynced[p];
      if (!touched[p]) delete remote[p];
      else scheduleApply();
    }

    // Escribe solo documentos cuyo contenido local difiere de lo último conocido en el servidor
    async function doFlush() {
      for (var guard = 0; guard < 50; guard++) {
        var docs = localDocs(), ops = [], p;
        for (p in docs) if (lastSynced[p] !== canon(docs[p])) ops.push({ t: 'set', p: p, rank: isProfilePath(p) ? 1 : 0 });
        for (p in lastSynced) if (!docs[p]) ops.push({ t: 'del', p: p, rank: isProfilePath(p) ? 2 : 3 });
        if (!ops.length) return;
        // trozos antes que el perfil al crear; perfil antes que sus trozos al borrar
        ops.sort(function (a, b) { return a.rank - b.rank; });
        for (var i = 0; i < ops.length; i++) {
          var op = ops[i], cur = localDocs();
          if (op.t === 'set') {
            var body = cur[op.p];
            if (!body) continue;
            var key = canon(body);
            if (lastSynced[op.p] === key) continue;
            await writeDoc(op.p, body, key);
          } else {
            if (cur[op.p] || lastSynced[op.p] === undefined) continue;
            await deleteDoc(op.p);
          }
        }
      }
    }

    async function flush() {
      if (mode !== 'db') return;
      if (flushing) { dirty = true; return; }
      flushing = true; dirty = false;
      setStatus('saving');
      var ok = false;
      try {
        try { await doFlush(); }
        catch (e) {
          if (e && e.code === 'unavailable') {
            await sleep(cfg.retryMin + Math.random() * cfg.retryRange);
            await doFlush();
          } else throw e;
        }
        ok = true;
      } catch (e) { handleError(e); }
      flushing = false;
      if (mode !== 'db') return;
      if (dirty) { dirty = false; schedule(0); }
      else if (ok) setStatus('synced');
    }

    // ---------- cambios en vivo ----------
    function subscribe() {
      unsubscribeAll();
      var onErr = function (e) {
        var code = e && e.code;
        if (ERR_LOCAL[code]) return goLocal();
        if (code === 'unavailable' && !resubscribed) { // el puente murió: una resuscripción
          resubscribed = true;
          unsubscribeAll();
          setTimeout(function () { if (mode === 'db') subscribe(); }, cfg.retryMin + Math.random() * cfg.retryRange);
          return;
        }
        handleError(e);
      };
      try {
        unsubs.push(profRef.limit(1000).onSnapshot(function (s) { onSnap(profRef.path, s); }, onErr));
        unsubs.push(chunksRef.limit(1000).onSnapshot(function (s) { onSnap(chunksRef.path, s); }, onErr));
      } catch (e) { onErr(e); }
    }

    function onSnap(prefix, snap) {
      if (mode !== 'db') return;
      snap.docChanges().forEach(function (ch) {
        var p = prefix + '/' + ch.doc.id;
        if (ch.type === 'removed') delete remote[p];
        else setRemote(p, ch.doc.data());
        if (writing[p]) touched[p] = true;
      });
      scheduleApply();
    }

    function busy() {
      try { return !!(env.App && typeof env.App.isBusy === 'function' && env.App.isBusy()); } catch (e) { return false; }
    }
    // Si la app está ocupada (cronómetro), se aplaza y se reintenta cada busyRetry ms
    function scheduleApply() {
      if (mode !== 'db' || applyTimer) return;
      if (busy()) {
        applyTimer = setTimeout(function () { applyTimer = null; scheduleApply(); }, cfg.busyRetry);
        return;
      }
      try { reconcile(); } catch (e) { handleError(e); }
    }

    function findSession(data, id) {
      for (var i = 0; i < data.sessions.length; i++) if (data.sessions[i].id === id) return data.sessions[i];
      return null;
    }

    // Compara lo observado en el servidor con la base (lastSynced) y con el estado local.
    // Sin cambios locales pendientes en un documento -> se adopta el remoto; con cambios locales gana el local.
    function reconcile() {
      var all = {}, p;
      for (p in remote) all[p] = 1;
      for (p in lastSynced) all[p] = 1;
      var diff = Object.keys(all).filter(function (q) { return !writing[q] && (remote[q] ? remote[q].key : undefined) !== lastSynced[q]; });
      if (!diff.length) return;

      var data = clone(Storage.get());
      var L = localDocsOf(data), memo = {};
      function lk(q) { if (!(q in memo)) memo[q] = L[q] ? canon(L[q]) : undefined; return memo[q]; }
      function rk(q) { return remote[q] ? remote[q].key : undefined; }
      var changed = false;

      // 1) perfiles
      diff.filter(isProfilePath).forEach(function (q) {
        var r = rk(q), b = lastSynced[q], l = lk(q);
        if (l === r) { setSynced(q, r); return; }   // ya coinciden (p. ej. eco de una escritura propia)
        if (l !== b) return;                         // cambio local pendiente: gana el local
        var pid = q.slice(profRef.path.length + 1);
        if (r === undefined) {                       // perfil eliminado en el otro dispositivo
          data.sessions = data.sessions.filter(function (s) { return s.id !== pid; });
          delete lastSynced[q];
          Object.keys(lastSynced).forEach(function (c) { if (chunkPid(c) === pid) delete lastSynced[c]; });
          changed = true;
        } else {                                     // perfil nuevo o modificado
          var body = clone(remote[q].body), s = findSession(data, pid);
          if (!s) { s = { solves: [] }; data.sessions.push(s); }
          s.id = pid; s.name = body.name; s.created = body.created;
          s.settings = body.settings; s.trainer = body.trainer; s.plan = body.plan;
          lastSynced[q] = r; changed = true;
        }
      });

      // 2) resoluciones: se reconstruyen por perfil a partir de sus trozos
      var pids = {};
      diff.forEach(function (q) { var pid = chunkPid(q); if (pid !== null) pids[pid] = 1; });
      Object.keys(pids).forEach(function (pid) {
        var s = findSession(data, pid);
        if (!s) return; // perfil aún desconocido: los trozos quedan en caché hasta que llegue
        var group = {};
        [remote, lastSynced, L].forEach(function (m) { Object.keys(m).forEach(function (q) { if (chunkPid(q) === pid) group[q] = 1; }); });
        var paths = Object.keys(group);
        if (paths.some(function (q) { return writing[q]; })) return;
        if (paths.every(function (q) { return rk(q) === lastSynced[q]; })) return;
        var pending = paths.some(function (q) { return lk(q) !== lastSynced[q] && lk(q) !== rk(q); });
        if (paths.every(function (q) { return lk(q) === rk(q); })) { paths.forEach(function (q) { setSynced(q, rk(q)); }); return; }
        if (pending) { // gana el local; los que ya coinciden se dan por sincronizados
          paths.forEach(function (q) { if (lk(q) === rk(q)) setSynced(q, rk(q)); });
          return;
        }
        var list = paths.filter(function (q) { return remote[q]; }).map(function (q) { return remote[q].body; })
          .sort(function (a, c) { return a.k - c.k; });
        var solves = [];
        list.forEach(function (c) { solves = solves.concat(c.solves || []); });
        // Solo se adopta un conjunto de trozos coherente (puede llegar a medias mientras el otro dispositivo escribe)
        var expect = chunkize(pid, solves), ep = Object.keys(expect);
        var remPaths = paths.filter(function (q) { return remote[q]; });
        var coherent = ep.length === remPaths.length && ep.every(function (q) { return remote[q] && canon(expect[q]) === remote[q].key; });
        if (!coherent) return;
        s.solves = clone(solves);
        paths.forEach(function (q) { setSynced(q, rk(q)); });
        changed = true;
      });

      if (changed) {
        keepLocalActive(data);
        Storage.replaceAll(data, { silent: true });
        if (hasPending()) schedule();
      }
    }

    // ---------- arranque ----------
    async function start() {
      if (!env.claude || typeof env.claude.use !== 'function') return goLocal();
      setStatus('connecting');
      try {
        var res = await Promise.all([env.claude.use('db'), env.claude.use('user')]);
        if (!res[0] || !res[1]) return goLocal();
        var uid = await res[1].id();
        if (!uid) return goLocal();
        db = res[0];
        metaRef = db.doc('data/users/' + uid + '/meta');
        profRef = metaRef.collection('profiles');
        chunksRef = metaRef.collection('chunks');
        try { await initialLoad(); }
        catch (e) {
          if (!e || e.code !== 'unavailable') throw e;
          await sleep(cfg.retryMin + Math.random() * cfg.retryRange);
          await initialLoad();
        }
        Storage.setSaveHook(function () { schedule(); });
      } catch (e) { handleError(e); }
    }

    var api = {
      status: status, detail: detail,
      onStatus: function (fn) { listeners.push(fn); fn(status, detail); },
      start: start,
      idle: function () {
        return new Promise(function (res) {
          (function poll() { if (timer || flushing || dirty || applyTimer) setTimeout(poll, 3); else res(); })();
        });
      },
      _chunkSize: CHUNK_SIZE
    };
    return api;
  }

  var Sync = { create: create };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Sync; }
  else {
    root.Sync = create(root);
    root.Sync.start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
