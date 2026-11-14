(function (root) {
  'use strict';
  // Diálogos propios (confirm/prompt/alert no funcionan en iframes restringidos).
  // Usan la clase .modal-backdrop para que el cronómetro ignore el teclado mientras están abiertos.
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  function open(message, o) {
    var cancelTxt = root.I18N ? root.I18N.t('common.cancel') : 'Cancelar';
    var okTxt = root.I18N ? root.I18N.t('common.ok') : 'Aceptar';
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var b = document.createElement('div');
      b.className = 'modal-backdrop';
      b.innerHTML = '<div class="modal dlg" role="dialog" aria-modal="true" aria-label="' + esc(message) + '">' +
        '<p class="dlg-msg">' + esc(message) + '</p>' +
        (o.input ? '<input type="text" class="dlg-input" id="dlg-input" autocomplete="off">' : '') +
        '<div class="dlg-btns"><button class="btn" data-r="cancel">' + esc(cancelTxt) + '</button>' +
        '<button class="btn ' + (o.danger ? 'danger-fill' : 'primary') + '" data-r="ok">' + esc(o.okText || okTxt) + '</button></div></div>';
      var input = b.querySelector('#dlg-input');
      if (input) input.value = o.defaultValue || '';
      var done = false;
      function close(val) {
        if (done) return; done = true;
        document.removeEventListener('keydown', onKey, true);
        b.remove();
        if (prev && prev.focus) { try { prev.focus(); } catch (e) { /* ignorar */ } }
        resolve(val);
      }
      function accept() { close(o.input ? input.value : true); }
      function cancel() { close(o.input ? null : false); }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
        else if (e.key === 'Enter') {
          var t = e.target;
          if (t && t.dataset && t.dataset.r === 'cancel') return;
          e.preventDefault(); e.stopPropagation(); accept();
        }
      }
      b.addEventListener('click', function (e) {
        if (e.target === b) return cancel();
        var r = e.target.closest && e.target.closest('[data-r]');
        if (r) { if (r.dataset.r === 'ok') accept(); else cancel(); }
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(b);
      if (input) { input.focus(); input.select(); } else b.querySelector('[data-r="ok"]').focus();
    });
  }

  var Dialog = {
    confirm: function (message, opts) { return open(message, opts || {}); },
    prompt: function (message, defaultValue) { return open(message, { input: true, defaultValue: defaultValue }); },
    toast: function (text) {
      var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
      document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
    }
  };
  root.Dialog = Dialog;
})(window);
