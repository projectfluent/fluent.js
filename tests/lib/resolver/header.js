/* global navigator, process, exports */
/* exported Resolver */

'use strict';

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Resolver = L10n.Resolver;
} else {
  var L10n = {
    PropertiesParser:
      require('../../../lib/l20n/format/properties/parser').PropertiesParser,
    Resolver: process.env.L20N_COV ?
      require('../../../build/cov/lib/l20n/resolver'):
      require('../../../lib/l20n/resolver'),
    getPluralRule: require('../../../lib/l20n/plurals').getPluralRule
  };

  exports.createEntries = createEntries;
  exports.Resolver = L10n.Resolver;
}

var propertiesParser = new L10n.PropertiesParser();

function createEntries(source) {
  /* jshint -W089 */
  var entries = Object.create(null);
  var ast = propertiesParser.parse(null, source);

  for (var id in ast) {
    entries[id] = L10n.Resolver.createEntity(id, ast[id], entries);
  }

  entries.__plural = L10n.getPluralRule('en-US');
  return entries;
}
