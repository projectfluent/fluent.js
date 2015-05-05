'use strict';

import Env from '../../lib/env';
import {
  whenInteractive, getMeta, getResourceLinks, getSupportedLanguages,
  getLanguageSources, initLocale
} from '../../bindings/html';
import io from '../../bindings/html/io';

const additionalLangs = navigator.mozApps.getAdditionalLanguages();

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

  window.addEventListener('languagechange',
    () => additionalLangs.then(onLangChange.bind(null, meta)));
  document.addEventListener('additionallanguageschange',
    (evt) => onLangChange(meta, evt.detail));
}

function onLangChange(meta, additionalLangs) {
  let prevSupportedLangs = navigator.mozL10n.languages;

  navigator.mozL10n.languages = getSupportedLanguages(
    meta, additionalLangs, navigator.languages);
  navigator.mozL10n.languageSources = getLanguageSources(
    meta, additionalLangs);

  return Promise.all([
    prevSupportedLangs, navigator.mozL10n.languages]).then(
      all => changeLanguage(...all));
}

function changeLanguage(prevSupportedLangs, newSupportedLangs) {
  if (!arrEqual(prevSupportedLangs, newSupportedLangs)) {
    initLocale.call(navigator.mozL10n);

    // XXX each l10n view should emit?
    document.dispatchEvent(new CustomEvent('supportedlanguageschange', {
      bubbles: false,
      cancelable: false,
      detail: {
        languages: newSupportedLangs
      }
    }));
  }
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}
