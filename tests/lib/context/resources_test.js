/* global it, assert:true, describe, beforeEach */
/* global window, navigator, process, __dirname */
'use strict';

var assert = require('assert') || window.assert;
var path = function(basedir, leaf) {
  return basedir + '/' + leaf;
};

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Env = L10n.Env;
  var path = path.bind(
    null, 'app://sharedtest.gaiamobile.org/test/unit/l10n/context');
} else {
  var Env = process.env.L20N_COV ?
    require('../../../build/cov/lib/l20n/env').Env
    : require('../../../lib/l20n/env').Env;
  var path = path.bind(null, __dirname);
}

describe('Missing resources', function() {
  var l10n;

  beforeEach(function() {
    l10n = new Env('myapp', {
      version: 2.0,
      locales: {
        'pl': {
          'version': '1.0-1'
        },
        'de': {
          'version': '1.0-1'
        },
        'en-US': {
          'version': '1.0-1'
        }
      },
      default_locale: 'en-US'
    });
  });

  it('should create an incomplete context with one missing resource',
    function(done) {
    var ctx = l10n.require(['pl'], [
      path('fixtures/{locale}.properties'),
      path('fixtures/missing.properties')]);
    ctx.ready.then(function(supported) {
      assert.deepEqual(supported, ['pl', 'en-US']);
      assert.equal(
        l10n._resCache[path('fixtures/{locale}.properties')].pl.foo,
        'Foo pl');
      assert.equal(
        l10n._resCache[path('fixtures/missing.properties')].pl.name,
        'L10nError');
    }).then(done, done);
  });

  it('should create an incomplete context with no valid resources',
    function(done) {
    var ctx = l10n.require(['pl'], [
      path('fixtures/missing.properties'),
      path('fixtures/another.properties')]);
    ctx.ready.then(function() {
      assert.equal(
        l10n._resCache[path('fixtures/missing.properties')].pl.name,
        'L10nError');
      assert.equal(
        l10n._resCache[path('fixtures/another.properties')].pl.name,
        'L10nError');
    }).then(done, done);
  });

});
