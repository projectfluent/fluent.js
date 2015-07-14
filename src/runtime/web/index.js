'use strict';

import { fetch } from './io';
import { Service } from '../../bindings/html/service';

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
  const service = new Service(fetch);
  window.addEventListener('languagechange', service);
  document.addEventListener('additionallanguageschange', service);
  document.l10n.languages = navigator.languages;
}

whenInteractive(init);
