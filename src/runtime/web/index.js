'use strict';

import Env from '../../lib/env';
import {
  whenInteractive, getMeta, getResourceLinks, getSupportedLanguages,
  getLanguageSources, initLocale
} from '../../bindings/html';
import io from '../../bindings/html/io';

let additionalLangs = navigator.mozApps.getAdditionalLanguages();

whenInteractive(init.bind(navigator.mozL10n));

function init() {
  let meta = getMeta(document.head);
  let getSource = lang => navigator.mozL10n.languageSources[lang];
  let fetch = io.fetch.bind(io, getSource, meta.appVersion);
  navigator.mozL10n.env = new Env(fetch, document.URL);

  navigator.mozL10n.languages = additionalLangs.then(
    additionalLangs => getSupportedLanguages(
      meta, additionalLangs, navigator.languages));
  navigator.mozL10n.languagesSources = getLanguageSources(
    meta, additionalLangs);

  this.documentView = this.env.createView(getResourceLinks());
  initLocale.call(navigator.mozL10n);

  window.addEventListener('languagechange', function() {
    navigator.mozL10n.languages = additionalLangs.then(
      additionalLangs => getSupportedLanguages(
        meta, additionalLangs, navigator.languages));
    initLocale.call(navigator.mozL10n);
  });

  document.addEventListener('additionallanguageschange', additionalLangs => {
    navigator.mozL10n.languages = getSupportedLanguages(
      meta, additionalLangs, navigator.languages);
    navigator.mozL10n.languageSources = getLanguageSources(
      meta, additionalLangs);
    initLocale.call(navigator.mozL10n);
  });
}
