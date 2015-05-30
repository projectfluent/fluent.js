/* global navigator, exports */

'use strict';

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
} else {
  var L10n = {
    PropertiesParser:
      require('../../../src/lib/format/properties/parser'),
    Resolver: require('../../../src/lib/resolver'),
    getPluralRule: require('../../../src/lib/plurals')
  };

  exports.Resolver = L10n.Resolver;
  exports.createEntries = createEntries;
  exports.MockContext = MockContext;
}


function createEntries(source) {
  /* jshint -W089 */
  var entries = Object.create(null);
  var ast = L10n.PropertiesParser.parse(null, source);

  var lang = {
    code:'en-US',
    src: 'app',
    dir: 'ltr'
  };

  for (var i = 0, len = ast.length; i < len; i++) {
    entries[ast[i].$i] = L10n.Resolver.createEntry(ast[i], lang);
  }

  return entries;
}

function MockContext(entries) {
  this._getEntity = function(lang, id) {
    return entries[id];
  };

  this._getMacro = function(lang, id) {
    switch(id) {
      case 'plural':
        return L10n.getPluralRule(lang.code);
      default:
        return undefined;
    }
  };
}
