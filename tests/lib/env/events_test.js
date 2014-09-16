/* global it, assert:true, describe, beforeEach */
/* global window, navigator, process */
'use strict';

var assert = require('assert') || window.assert;

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Env = L10n.Env;
} else {
  var Env = process.env.L20N_COV ?
    require('../../../build/cov/lib/l20n/env').Env
    : require('../../../lib/l20n/env').Env;
}

describe('Newly created env', function() {

  it('emits the availablelanguageschange event', function(done) {
    var l10n = new Env('myapp', {
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
    l10n.addEventListener('availablelanguageschange', function(available) {
      assert.deepEqual(available, ['pl', 'de', 'en-US']);
      done();
    });
  });

  it('emits the languagechange event', function(done) {
    var l10n = new Env('myapp', {
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
    l10n.addEventListener('languagechange', function(supported) {
      assert.deepEqual(supported, ['pl', 'en-US']);
      done();
    });
  });

});

describe('Existing env', function() {
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
    l10n.supported.then(done.bind(null, null), done);
  });

  it('emits the languagechange event', function(done) {
    l10n.addEventListener('languagechange', function(supported) {
      assert.deepEqual(supported, ['de', 'en-US']);
      done();
    });
    l10n.request(['de']);
  });

});
