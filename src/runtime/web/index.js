'use strict';

/* global Context, onReady, whenInteractive, init */

var DEBUG = false;

navigator.mozL10n.ctx = new Context(window.document ? document.URL : null);
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

  var forcePretranslate = !navigator.mozL10n._config.isPretranslated;
  whenInteractive(init.bind(navigator.mozL10n, forcePretranslate));
}
