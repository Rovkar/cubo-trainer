(function (root) {
  'use strict';
  var container = null;
  var open = {}; // overrides manuales de plegado

  function esc(s) { return root.escHtml(s); }

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
    h += '<div class="card highlight"><h3>Situación de ' + esc(root.Storage.activeSession().name) + '</h3><ul class="plain">' +
      '<li>ao12 actual: <b>' + (ao === null ? 'aún no hay 12 resoluciones' : root.Stats.formatTime(ao)) + '</b></li>';
    if (cur) {
      h += '<li>Fase actual: <b>' + esc(cur.title) + '</b></li><li>Meta: <b>' + esc(cur.goal) + '</b></li></ul>';
      if (cur.goalMs && ao !== null && ao !== Infinity && ao <= cur.goalMs) {
        h += '<p class="good">Tu ao12 ya cumple la meta de esta fase. Marca los hitos que te falten y pasa a la siguiente: vas muy bien.</p>';
      }
    } else {
      h += '<li>Has completado todas las fases del plan.</li></ul><p class="good">Enhorabuena, has completado el plan. Sigue practicando y fijando nuevas metas.</p>';
    }
    h += '</div>';

    plan.phases.forEach(function (p) {
      var done = phaseDone(p), isCur = cur && cur.id === p.id;
      var cnt = p.milestones.filter(function (x) { return M[x.id]; }).length;
      var pct = Math.round(cnt / p.milestones.length * 100);
      var isOpen = open[p.id] !== undefined ? open[p.id] : !done;
      h += '<details class="card phase' + (isCur ? ' current' : '') + (done ? ' done' : '') + '" data-phase="' + p.id + '"' + (isOpen ? ' open' : '') + '>' +
        '<summary><span class="ph-title">' + esc(p.title) + (done ? ' ✓' : '') + (isCur ? ' <span class="chip chip-aprendiendo">Fase actual</span>' : '') + '</span>' +
        '<span class="muted small">' + esc(p.weeks) + ' · ' + cnt + '/' + p.milestones.length + '</span></summary>' +
        '<p><b>Meta:</b> ' + esc(p.goal) + '</p><p>' + p.summary + '</p>';
      p.sections.forEach(function (s) {
        h += '<h4>' + esc(s.heading) + '</h4><ul>' + s.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
      });
      h += '<h4>Hitos</h4><div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div><ul class="plain miles">' +
        p.milestones.map(function (x) {
          return '<li><label class="check"><input type="checkbox" data-ms="' + x.id + '"' + (M[x.id] ? ' checked' : '') + '> ' + esc(x.text) + '</label></li>';
        }).join('') + '</ul></details>';
    });

    var r = plan.routine;
    h += '<div class="card"><h3>' + esc(r.title) + '</h3><ul class="plain routine">' +
      r.blocks.map(function (b) {
        return '<li><b>' + esc(b.minutes) + ' min · ' + esc(b.title) + '</b><br><span class="muted">' + b.text + '</span></li>';
      }).join('') + '</ul></div>';
    h += '<div class="card"><h3>Consejos</h3><ul>' + plan.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>';
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
