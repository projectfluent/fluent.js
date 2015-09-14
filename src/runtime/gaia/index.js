'use strict';

import '../web/index';

//Bug 1204660 - Temporary proxy for shared code. Will be removed once
//              l10n.js migration is completed.
navigator.mozL10n = {
  setAttributes: document.l10n.setAttributes,
  getAttributes: document.l10n.getAttributes,
  formatValue: (...args) => document.l10n.formatValue(...args),
  translateFragment: (...args) => document.l10n.translateFragment(...args),
  once: cb => document.l10n.ready.then(cb),
  ready: cb => document.l10n.ready.then(() => {
    document.addEventListener('DOMLocalized', cb);
    cb();
  }),
};
