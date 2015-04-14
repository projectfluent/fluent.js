'use strict';

/* global Env, whenInteractive */
/* global init, initLocale, getSupportedLanguages */

navigator.mozL10n.env = new Env(window.document ? document.URL : null);

if (window.document) {
  navigator.mozL10n._config.isPretranslated =
    document.documentElement.lang === navigator.language;

  // XXX always pretranslate if data-no-complete-bug is set;  this is
  // a workaround for a netError page not firing some onreadystatechange
  // events;  see https://bugzil.la/444165
  var pretranslate = document.documentElement.dataset.noCompleteBug ?
    true : !navigator.mozL10n._config.isPretranslated;
  // use a regular callback instead of .then() because this needs to run
  // before other readystatechange handlers run (a promise would force a tick)
  whenInteractive(init.bind(navigator.mozL10n, pretranslate));
}

window.addEventListener('languagechange', function() {
  navigator.mozL10n.languages = getSupportedLanguages();
  initLocale.call(navigator.mozL10n);
});
