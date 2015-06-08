'use strict';

import { fetch } from './io';
import { L10n, init } from '../../bindings/html/service';
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

  document.addEventListener('readystatechange', function l10n_onrsc() {
    if (readyStates[document.readyState] >= readyStates.interactive) {
      document.removeEventListener('readystatechange', l10n_onrsc);
      callback();
    }
  });
}

whenInteractive(
  init.bind(window.L10n = L10n, fetch, additionalLangsAtLaunch));
