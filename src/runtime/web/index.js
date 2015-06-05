'use strict';

import io from './io';
import Env from '../../lib/env';
import { L10n } from '../../bindings/html/service';
import { View } from '../../bindings/html/view';
import { getMeta } from '../../bindings/html/head';
import {
  changeLanguage, onlanguagechage, onadditionallanguageschange,
  getAdditionalLanguages
} from '../../bindings/html/langs';

const additionalLangsAtLaunch = getAdditionalLanguages();
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
    document.URL, defaultLang, io.fetch.bind(io, appVersion));
  this.views.push(
    document.l10n = new View(this, document));

  let setLanguage = additionalLangs => changeLanguage.call(
    this, appVersion, defaultLang, availableLangs, additionalLangs, [],
    navigator.languages);

  this.languages = additionalLangsAtLaunch.then(
    setLanguage, setLanguage);

  this.change = onlanguagechage.bind(
    this, appVersion, defaultLang, availableLangs);

  window.addEventListener('languagechange',
    () => onlanguagechage.call(
      this, appVersion, defaultLang, availableLangs, navigator.languages));
  document.addEventListener('additionallanguageschange',
    evt => onadditionallanguageschange.call(
      this, appVersion, defaultLang, availableLangs, evt.detail,
      navigator.languages));
}

whenInteractive(init.bind(window.L10n = L10n));
