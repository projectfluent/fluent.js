'use strict';

import io from '../../bindings/html/io';
import Env from '../../lib/env';
import { L10n } from '../../bindings/html/service';
import { View } from '../../bindings/html/view';
import { getMeta } from '../../bindings/html/head';
import {
  changeLanguage, onlanguagechage, onadditionallanguageschange
} from '../../bindings/html/langs';

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
  let {
   defaultLang, availableLangs, appVersion
  } = getMeta(document.head);

  this.env = new Env(
    document.URL, io.fetch.bind(io, appVersion));
  this.views.push(
    document.l10n = new View(this, document));

  this.languages = additionalLangsAtLaunch.then(
    additionalLangs =>
      changeLanguage.call(
        this, appVersion, defaultLang, availableLangs, additionalLangs, [],
        navigator.languages),
    changeLanguage.bind(
      this, appVersion, defaultLang, availableLangs, null, [],
      navigator.languages));

  window.addEventListener('languagechange',
    onlanguagechage.bind(this, appVersion, defaultLang, availableLangs));
  document.addEventListener('additionallanguageschange',
    onadditionallanguageschange.bind(
      this, appVersion, defaultLang, availableLangs));
}

whenInteractive(init.bind(window.L10n = L10n));
