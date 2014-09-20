/* global window, navigator, process, exports, assert:true */
/* exported assert, compile */

'use strict';

var assert = require('assert') || window.assert;
var PropertiesParser;

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  PropertiesParser = L10n.PropertiesParser;
} else {
  var L10n = {
    Entity: process.env.L20N_COV ?
      require('../../../build/cov/lib/l20n/compiler').Entity :
      require('../../../lib/l20n/compiler').Entity,
    getPluralRule: require('../../../lib/l20n/plurals').getPluralRule
  };

  PropertiesParser = process.env.L20N_COV ?
    require('../../../build/cov/lib/l20n/parser').PropertiesParser
    : require('../../../lib/l20n/format/properties/parser').PropertiesParser;
}

var propertiesParser = new PropertiesParser();

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

function compile(source) {
  /* jshint -W089 */
  var ctx = new MockContext();
  var ast = propertiesParser.parse(source);
  for (var id in ast) {
    ctx.cache[id] = new L10n.Entity(id, ast[id], 'en-US');
  }
  return ctx;
}

exports.assert = assert;
exports.compile = compile;
