'use strict';

/* global Context, Env, onReady, interactive, init */

var DEBUG = false;

navigator.mozL10n.ctx = new Context(window.document ? document.URL : null);
navigator.mozL10n.env = new Env(window.document ? document.URL : null);
navigator.mozL10n.ctx.ready(onReady.bind(navigator.mozL10n));

navigator.mozL10n.ctx.addEventListener('notfounderror',
  function reportMissingEntity(e) {
    if (DEBUG || e.loc === 'en-US') {
      console.warn(e.toString());
    }
});

if (DEBUG) {
  navigator.mozL10n.ctx.addEventListener('fetcherror',
    console.error.bind(console));
  navigator.mozL10n.ctx.addEventListener('parseerror',
    console.error.bind(console));
  navigator.mozL10n.ctx.addEventListener('resolveerror',
    console.error.bind(console));
}

if (window.document) {
  navigator.mozL10n._config.isPretranslated =
    document.documentElement.lang === navigator.language;

  // XXX always pretranslate if data-no-complete-bug is set;  this is
  // a workaround for a netError page not firing some onreadystatechange
  // events;  see https://bugzil.la/444165
  var pretranslate = document.documentElement.dataset.noCompleteBug ?
    true : !navigator.mozL10n._config.isPretranslated;
  interactive.then(init.bind(navigator.mozL10n, pretranslate));
}
