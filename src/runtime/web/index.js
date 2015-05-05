'use strict';

import Env from '../../lib/env';
import {
  whenInteractive, getMeta, getResourceLinks, getSupportedLanguages,
  getLanguageSources, initLocale, L10n
} from '../../bindings/html';
import io from '../../bindings/html/io';

const additionalLangsAtLaunch = navigator.mozApps.getAdditionalLanguages();

whenInteractive(init.bind(navigator.mozL10n = L10n));

function init() {
  let meta = this.meta = getMeta(document.head);
  let getSource = lang => navigator.mozL10n.languageSources[lang];
  let fetch = io.fetch.bind(io, getSource, meta.appVersion);
  this.env = new Env(fetch, document.URL);

  this.languages = additionalLangsAtLaunch.then(
    additionalLangs => {
      this.languagesSources = getLanguageSources(meta, additionalLangs);
      return getSupportedLanguages(
        meta, additionalLangs, navigator.languages);
    });

  this.documentView = this.env.createView(getResourceLinks());
  initLocale.call(this);

  window.addEventListener('languagechange', this);
  document.addEventListener('additionallanguageschange', this);
}
