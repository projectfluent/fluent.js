/* global it, assert:true, describe, before, beforeEach */
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
  path = path.bind(null, __dirname);
}

describe('Two supported locales', function() {
  var l10n, ctx;

  before(function() {
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
  });

  beforeEach(function() {
    ctx = l10n.require([path('fixtures/{locale}.properties')]);
  });

  describe('Translation in the 1st locale exists and is OK', function(done) {
    it('[e]', function() {
      ctx.get('e').then(function(val) {
        assert.strictEqual(val, 'E pl');
      }).then(done, done);
    });
  });

  describe.skip('ValueError in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[ve]', function(done) {
        ctx.get('ve').then(function(val) {
          assert.strictEqual(val, 'VE {{ boo }} pl');
        }).then(done, done);
      });
    });

    describe('ValueError in second locale:', function() {
      it('[vv]', function(done) {
        ctx.get('vv').then(function(val) {
          assert.strictEqual(val, 'VV {{ boo }} pl');
        }).then(done, done);
      });
    });

    describe('IndexError in second locale:', function() {
      it('[vi]', function(done) {
        ctx.get('vi').then(function(val) {
          assert.strictEqual(val, 'VI {{ boo }} pl');
        }).then(done, done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[vm]', function(done) {
        ctx.get('vm').then(function(val) {
          assert.strictEqual(val, 'VM {{ boo }} pl');
        }).then(done, done);
      });
    });
  });

  describe.skip('IndexError in first locale', function() {
    describe('Entity exists in second locale', function() {
      it('[ie]', function(done) {
        ctx.get('ie').then(function(val) {
          assert.strictEqual(val, undefined);
        }).then(done, done);
      });
    });

    describe('ValueError in second locale', function() {
      it('[iv]', function(done) {
        ctx.get('iv').then(function(val) {
          assert.strictEqual(val, undefined);
        }).then(done, done);
      });
    });

    describe('IndexError in second locale', function() {
      it('[ii]', function(done) {
        ctx.get('ii').then(function(val) {
          assert.strictEqual(val, undefined);
        }).then(done, done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[im]', function() {
        var entity = ctx.getEntity('im');
        assert.strictEqual(entity, undefined);
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[me]', function(done) {
        ctx.get('me').then(function(val) {
          assert.strictEqual(val, 'ME en-US');
        }).then(done, done);
      });
    });

    describe.skip('ValueError in second locale:', function() {
      it('[mv]', function(done) {
        ctx.get('mv').then(function(val) {
          assert.strictEqual(val, 'MV {{ boo }} en-US');
        }).then(done, done);
      });
    });

    describe.skip('IndexError in second locale:', function() {
      it('[mi]', function(done) {
        ctx.get('mi').then(function(val) {
          assert.strictEqual(val, undefined);
        }).then(done, done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it.only('[mm]', function(done) {
        ctx.get('mm').then(function(val) {
          assert.strictEqual(val, null);
        }).then(done, done);
      });
    });
  });
});
