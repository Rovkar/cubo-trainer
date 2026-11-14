(function (root) {
  'use strict';
  var container = null;
  var open = {}; // overrides manuales de plegado

  function esc(s) { return root.escHtml(s); }
  function t(key, params) { return root.I18N.t(key, params); }

  function phaseDone(p) {
    var m = root.Storage.milestones();
    return p.milestones.every(function (x) { return m[x.id]; });
  }
  function currentPhase() {
    var P = root.TRAINING_PLAN.phases;
    for (var i = 0; i < P.length; i++) if (!phaseDone(P[i])) return P[i];
    return null;
  }

  function currentAo12() {
    var times = root.Storage.activeSession().solves.map(root.Stats.effectiveTime);
    return root.Stats.averageOf(times, 12);
  }

  function render() {
    if (!container) return;
    var plan = root.TRAINING_PLAN, M = root.Storage.milestones();
    var cur = currentPhase(), ao = currentAo12();
    var h = '<div class="card"><p>' + plan.intro + '</p></div>';
    h += '<div class="card highlight"><h3>' + esc(t('plan.situation', { name: root.Storage.activeSession().name })) + '</h3><ul class="plain">' +
      '<li>' + esc(t('plan.currentAo12')) + ' <b>' + (ao === null ? esc(t('plan.noAo12')) : root.Stats.formatTime(ao)) + '</b></li>';
    if (cur) {
      h += '<li>' + esc(t('plan.currentPhase')) + ' <b>' + esc(cur.title) + '</b></li><li>' + esc(t('plan.goal')) + ' <b>' + esc(cur.goal) + '</b></li></ul>';
      if (cur.goalMs && ao !== null && ao !== Infinity && ao <= cur.goalMs) {
        h += '<p class="good">' + esc(t('plan.goalMet')) + '</p>';
      }
    } else {
      h += '<li>' + esc(t('plan.allDone')) + '</li></ul><p class="good">' + esc(t('plan.congrats')) + '</p>';
    }
    h += '</div>';

    plan.phases.forEach(function (p) {
      var done = phaseDone(p), isCur = cur && cur.id === p.id;
      var cnt = p.milestones.filter(function (x) { return M[x.id]; }).length;
      var pct = Math.round(cnt / p.milestones.length * 100);
      var isOpen = open[p.id] !== undefined ? open[p.id] : !done;
      h += '<details class="card phase' + (isCur ? ' current' : '') + (done ? ' done' : '') + '" data-phase="' + p.id + '"' + (isOpen ? ' open' : '') + '>' +
        '<summary><span class="ph-title">' + esc(p.title) + (done ? ' ✓' : '') + (isCur ? ' <span class="chip chip-aprendiendo">' + esc(t('plan.phaseBadge')) + '</span>' : '') + '</span>' +
        '<span class="muted small">' + esc(p.weeks) + ' · ' + cnt + '/' + p.milestones.length + '</span></summary>' +
        '<p><b>' + esc(t('plan.goal')) + '</b> ' + esc(p.goal) + '</p><p>' + p.summary + '</p>';
      p.sections.forEach(function (s) {
        h += '<h4>' + esc(s.heading) + '</h4><ul>' + s.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
      });
      h += '<h4>' + esc(t('plan.milestones')) + '</h4><div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div><ul class="plain miles">' +
        p.milestones.map(function (x) {
          return '<li><label class="check"><input type="checkbox" data-ms="' + x.id + '"' + (M[x.id] ? ' checked' : '') + '> ' + esc(x.text) + '</label></li>';
        }).join('') + '</ul></details>';
    });

    var r = plan.routine;
    h += '<div class="card"><h3>' + esc(r.title) + '</h3><ul class="plain routine">' +
      r.blocks.map(function (b) {
        return '<li><b>' + esc(b.minutes) + ' min · ' + esc(b.title) + '</b><br><span class="muted">' + b.text + '</span></li>';
      }).join('') + '</ul></div>';
    h += '<div class="card"><h3>' + esc(t('plan.tips')) + '</h3><ul>' + plan.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>';
    container.innerHTML = h;
  }

  function mount(el) {
    container = el;
    el.addEventListener('change', function (e) {
      if (e.target.dataset.ms) {
        root.Storage.setMilestone(e.target.dataset.ms, e.target.checked);
        var y = window.scrollY;
        // conserva el estado abierto actual
        el.querySelectorAll('details.phase').forEach(function (d) { open[d.dataset.phase] = d.open; });
        render(); window.scrollTo(0, y);
      }
    });
    el.addEventListener('toggle', function (e) {
      if (e.target.dataset && e.target.dataset.phase) open[e.target.dataset.phase] = e.target.open;
    }, true);
    render();
  }

  root.PlanView = { mount: mount, render: render, currentPhase: currentPhase };
})(window);
