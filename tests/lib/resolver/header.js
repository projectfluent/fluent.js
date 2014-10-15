/* global navigator, process, exports */
/* exported Resolver */

'use strict';

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Resolver = L10n.Resolver;
} else {
  var L10n = {
    PropertiesParser:
      require('../../../lib/l20n/format/properties/parser'),
    Resolver: process.env.L20N_COV ?
      require('../../../build/cov/lib/l20n/resolver'):
      require('../../../lib/l20n/resolver'),
    getPluralRule: require('../../../lib/l20n/plurals').getPluralRule
  };

  exports.createContext = createContext;
  exports.Resolver = L10n.Resolver;
}

function MockContext() {
  this.cache = Object.create(null);
  this.macros = Object.create(null);
  this._getEntity = function(lang, id) {
    return this.cache[id];
  };
  this._getMacro = function(lang, id) {
    return this.macros[id] || L10n.getPluralRule(lang);
  };
}

function createContext(source) {
  /* jshint -W089 */
  var ctx = new MockContext();
  var ast = L10n.PropertiesParser.parse(null, source);
  for (var i = 0, len = ast.length; i < len; i++) {
    ctx.cache[ast[i].$i] = L10n.Resolver.createEntry(ast[i], 'en-US');
  }
  return ctx;
}
