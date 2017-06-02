/* global Components */
/* eslint no-unused-vars: 0 */

const Cc = Components.classes;
const Ci = Components.interfaces;

const ObserverService =
  Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);

import Localization from '../../fluent-dom/src/localization';

this.Localization = Localization;
this.EXPORTED_SYMBOLS = [];
