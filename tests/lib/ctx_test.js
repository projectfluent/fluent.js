/* global it, assert:true, describe, beforeEach */
/* global window, navigator, process */
'use strict';

var assert = require('assert') || window.assert;

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Env = L10n.Env;
} else {
  var Env = process.env.L20N_COV ?
    require('../../build/cov/lib/l20n/env').Env
    : require('../../lib/l20n/env').Env;
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
      var ctx = l10n.require(['res1', 'res2']);
      ctx.ready.then(function() {
        done();
      });
    });
  });

  describe('ctx.get', function() {
    it('returns the value from the AST', function(done) {
      var ctx = l10n.require(['res1', 'res2']);
      ctx.get('foo').then(function(val) {
        assert.strictEqual(val, 'this is fooundefined');
        done();
      });
    });
  });

  describe('ctx.destroy', function() {
    var ctx1, ctx2;

    beforeEach(function(done) {
      ctx1 = l10n.require(['res1', 'res2']);
      ctx1.ready.then(function() {
        done();
      });
    });

    it('removes the ctx from _ctxMap', function() {
      // XXX should it be possible to destroy contexts before they load?
      ctx1.destroy();
      assert.ok(
        !l10n._ctxMap.has(ctx1),
        'expected ctx to be removed from l10n._ctxMap');
    });
    it('removes the resources from _resCache', function() {
      ctx1.destroy();
      assert.ok(
        !l10n._resCache.res1,
        'expected res1 to be removed from l10n._resCache');
      assert.ok(
        !l10n._resCache.res2,
        'expected res2 to be removed from l10n._resCache');
    });
    it('removes the resources uniquely associated with the ctx',
       function() {
      ctx2 = l10n.require(['res1', 'res3']);
      ctx1.destroy();
      assert.ok(
        l10n._resCache.res1,
        'expected res1 to be defined in l10n._resCache');
      assert.ok(
        !l10n._resCache.res2,
        'expected res2 to be removed from l10n._resCache');
    });
  });

});
