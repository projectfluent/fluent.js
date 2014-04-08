/* global it, assert:true, describe, beforeEach */
/* global navigator, process, __dirname */

if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Context = L10n.Context;
  var path = 'http://gallery.gaiamobile.org:8080/test/unit/l10n/context';
} else {
  assert = require('assert');
  var Context = process.env.L20N_COV ?
    require('../../../build/cov/lib/l20n/context').Context
    : require('../../../lib/l20n/context').Context;
  var path = __dirname;
}

describe('Missing resources', function() {
  'use strict';

  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.resLinks.push(path + '/fixtures/en-US.properties');
    ctx.resLinks.push(path + '/fixtures/missing.properties');
    ctx.once(done);
    ctx.requestLocales();
  });

  it('should get ready', function() {
    assert.strictEqual(ctx.isReady, true);
  });
});

describe('No valid resources', function() {
  'use strict';

  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.resLinks.push(path + '/fixtures/missing.properties');
    ctx.resLinks.push(path + '/fixtures/another.properties');
    ctx.once(done);
    ctx.requestLocales();
  });

  it('should get ready', function() {
    assert.strictEqual(ctx.isReady, true);
  });
});
