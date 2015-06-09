'use strict';

import { fetch } from './io';
import { Service } from '../../bindings/html/service';
import { getAdditionalLanguages } from '../../bindings/html/langs';

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

  document.addEventListener('readystatechange', function onrsc() {
    if (readyStates[document.readyState] >= readyStates.interactive) {
      document.removeEventListener('readystatechange', onrsc);
      callback();
    }
  });
}

function init() {
  window.L10n = new Service(fetch, additionalLangsAtLaunch);
  window.addEventListener('languagechange', window.L10n);
  document.addEventListener('additionallanguageschange', window.L10n);
}

whenInteractive(init);
