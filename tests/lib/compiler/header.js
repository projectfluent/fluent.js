/* global navigator, process, exports */
/* exported compile */

'use strict';

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
} else {
  var L10n = {
    compile: process.env.L20N_COV ?
      require('../../../build/cov/lib/l20n/compiler').compile :
      require('../../../lib/l20n/compiler').compile,
    PropertiesParser:
      require('../../../lib/l20n/format/properties/parser').PropertiesParser,
    getPluralRule: require('../../../lib/l20n/plurals').getPluralRule
  };

  exports.compile = compile;
}

var propertiesParser = new L10n.PropertiesParser();

function compile(source) {
  var ast = propertiesParser.parse(null, source);
  var env = L10n.compile(null, ast);
  env.__plural = L10n.getPluralRule('en-US');
  return env;
}
