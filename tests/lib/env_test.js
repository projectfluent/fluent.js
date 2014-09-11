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

describe('Registering languages', function() {
  var l10n;

  beforeEach(function(done) {
    l10n = new Env('myapp');
    l10n.register({
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
    l10n.addEventListener('availablelanguageschange', function() {
      done();
    });
  });

  it('correctly sets the default language', function() {
    assert.strictEqual(l10n.default, 'en-US');
  });

  it('corectly sets the available languages', function() {
    assert.deepEqual(l10n.available, ['pl', 'de', 'en-US']);
  });

});

describe('Requesting languages', function() {
  var l10n;

  beforeEach(function(done) {
    l10n = new Env('myapp');
    l10n.register({
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
    l10n.addEventListener('availablelanguageschange', function() {
      done();
    });
  });

  it('correctly sets the supported languages', function() {
    l10n.request(['pl']);
    assert.deepEqual(l10n.supported, ['pl', 'en-US']);
  });

});
