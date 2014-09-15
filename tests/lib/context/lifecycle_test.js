/* global it, assert:true, describe, beforeEach */
/* global window, navigator, process */
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
  path = path.bind(null, __dirname);
}

describe('Context', function() {
  var l10n;

  beforeEach(function(done) {
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
    }, ['pl']);
    l10n.ready.then(function() {
      done();
    });
  });

  describe('ctx.ready', function() {
    it('is a promise', function(done) {
      var ctx = l10n.require([path('fixtures/{locale}.properties')]);
      ctx.ready.then(function() {
        done();
      });
    });
  });

  describe('ctx.get', function() {
    it('returns the value from the AST', function(done) {
      var ctx = l10n.require([path('fixtures/{locale}.properties')]);
      ctx.get('foo').then(function(val) {
        assert.strictEqual(val, 'Foo pl');
        done();
      }, function(err) {
        done(err);
      });
    });
  });

  describe('ctx.destroy', function() {
    var ctx1, ctx2;

    beforeEach(function(done) {
      ctx1 = l10n.require([
        path('fixtures/{locale}.properties'),
        path('fixtures/basic.properties')]);
      ctx1.ready.then(function() {
        done();
      });
    });

    it('removes the resources from _resCache', function() {
      // XXX should it be possible to destroy contexts before they load?
      ctx1.destroy();
      assert.ok(
        !l10n._resCache[path('fixtures/{locale}.properties')],
        'expected fixtures/{locale}.properties to be removed from ' +
          'l10n._resCache');
      assert.ok(
        !l10n._resCache[path('fixtures/basic.properties')],
        'expected fixtures/basic.properties to be removed from ' +
          'l10n._resCache');
    });
    it('removes the resources uniquely associated with the ctx',
       function() {
      ctx2 = l10n.require([path('fixtures/{locale}.properties')]);
      ctx1.destroy();
      assert.ok(
        l10n._resCache[path('fixtures/{locale}.properties')],
        'expected fixtures/{locale}.properties to be defined in ' +
          'l10n._resCache');
      assert.ok(
        !l10n._resCache[path('fixtures/basic.properties')],
        'expected fixtures/basic.properties to be removed from ' +
          'l10n._resCache');
    });
  });

});
