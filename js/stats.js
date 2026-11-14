(function (root) {
  'use strict';
  function effectiveTime(s) {
    if (!s) return null;
    if (s.penalty === 'DNF') return Infinity;
    return s.time + (s.penalty === '+2' ? 2000 : 0);
  }
  function averageOf(times, n) {
    if (!times || times.length < n) return null;
    var arr = times.slice(times.length - n);
    var trim = Math.ceil(n * 0.05);
    var dnf = 0;
    for (var i = 0; i < arr.length; i++) if (arr[i] === Infinity) dnf++;
    if (dnf > trim) return Infinity;
    arr.sort(function (a, b) { return a - b; }); // Infinity va al final
    var mid = arr.slice(trim, arr.length - trim);
    var sum = 0;
    for (var j = 0; j < mid.length; j++) sum += mid[j];
    return sum / mid.length;
  }
  function rollingAverage(times, n) {
    var out = [];
    for (var i = 0; i < times.length; i++) {
      out.push(i + 1 < n ? null : averageOf(times.slice(i + 1 - n, i + 1), n));
    }
    return out;
  }
  function bestAverage(times, n) {
    var best = null;
    rollingAverage(times, n).forEach(function (v) {
      if (v !== null && (best === null || v < best)) best = v;
    });
    return best;
  }
  function bestSingle(times) {
    var best = null;
    (times || []).forEach(function (v) { if (v !== Infinity && (best === null || v < best)) best = v; });
    return best;
  }
  function mean(times) {
    var s = 0, c = 0;
    (times || []).forEach(function (v) { if (v !== Infinity) { s += v; c++; } });
    return c ? s / c : null;
  }
  function formatTime(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) return '–';
    if (ms === Infinity) return 'DNF';
    var cs = Math.round(ms / 10);
    var totalS = Math.floor(cs / 100);
    var c = cs % 100;
    var cc = (c < 10 ? '0' : '') + c;
    if (totalS >= 60) {
      var m = Math.floor(totalS / 60), s = totalS % 60;
      return m + ':' + (s < 10 ? '0' : '') + s + '.' + cc;
    }
    return totalS + '.' + cc;
  }
  // keyFn (opcional) normaliza cada nombre de fase antes de compararlos; null/undefined = usar el nombre tal cual
  function sameArr(a, b, keyFn) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      var x = a[i], y = b[i];
      if (keyFn) {
        var kx = keyFn(x), ky = keyFn(y);
        x = kx === null || kx === undefined ? x : kx;
        y = ky === null || ky === undefined ? y : ky;
      }
      if (x !== y) return false;
    }
    return true;
  }
  function phaseBreakdown(solves, lastN, keyFn) {
    lastN = lastN || 12;
    var withSplits = (solves || []).filter(function (s) {
      return s.penalty !== 'DNF' && s.splits && s.splits.length && s.phases && s.phases.length === s.splits.length;
    });
    if (!withSplits.length) return { phases: [], count: 0 };
    var ref = withSplits[withSplits.length - 1].phases;
    var sel = withSplits.filter(function (s) { return sameArr(s.phases, ref, keyFn); }).slice(-lastN);
    var sums = ref.map(function () { return 0; });
    sel.forEach(function (s) {
      for (var i = 0; i < ref.length; i++) sums[i] += s.splits[i] - (i ? s.splits[i - 1] : 0);
    });
    var avgs = sums.map(function (v) { return v / sel.length; });
    var tot = avgs.reduce(function (a, b) { return a + b; }, 0) || 1;
    return {
      phases: ref.map(function (name, i) { return { name: name, avgMs: avgs[i], pct: avgs[i] / tot * 100 }; }),
      count: sel.length
    };
  }
  var Stats = { effectiveTime: effectiveTime, averageOf: averageOf, rollingAverage: rollingAverage,
    bestAverage: bestAverage, bestSingle: bestSingle, mean: mean, formatTime: formatTime, phaseBreakdown: phaseBreakdown };
  if (typeof module !== 'undefined' && module.exports) module.exports = Stats; else root.Stats = Stats;
})(typeof window !== 'undefined' ? window : globalThis);
