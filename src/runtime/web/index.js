'use strict';

import Env from '../../lib/env';
import {
  getMeta, getResourceLinks, L10n,
  changeLanguage, onlanguagechage, onadditionallanguageschange
} from '../../bindings/html';
import io from '../../bindings/html/io';

const additionalLangsAtLaunch = navigator.mozApps.getAdditionalLanguages();
const readyStates = {
  loading: 0,
  interactive: 1,
  complete: 2
};

function whenInteractive(callback) {
  if (readyStates[document.readyState] >= readyStates.interactive) {
    return callback();
  }

  document.addEventListener('readystatechange', function l10n_onrsc() {
    if (readyStates[document.readyState] >= readyStates.interactive) {
      document.removeEventListener('readystatechange', l10n_onrsc);
      callback();
    }
  });
}

function init() {
  let meta = getMeta(document.head);

  this.env = new Env(document.URL, io.fetch.bind(io, meta.appVersion));
  this.documentView = this.env.createView(getResourceLinks());

  this.languages = additionalLangsAtLaunch.then(
    additionalLangs =>
      changeLanguage.call(
        this, meta, [], additionalLangs, navigator.languages),
    changeLanguage.bind(this, meta, [], null, navigator.languages));

  window.addEventListener('languagechange',
    onlanguagechage.bind(this, meta));
  document.addEventListener('additionallanguageschange',
    onadditionallanguageschange.bind(this, meta));
}

whenInteractive(init.bind(navigator.mozL10n = L10n));
