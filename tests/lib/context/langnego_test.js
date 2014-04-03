if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Context = L10n.Context;
} else {
  assert = require('assert');
  var Context = process.env.L20N_COV
    ? require('../../../build/cov/lib/l20n/context').Context
    : require('../../../lib/l20n/context').Context;
}

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('Language negotiation without arguments', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('used the en-US locale', function() {
    assert.strictEqual(ctx.supportedLocales.length, 1);
    assert.strictEqual(ctx.supportedLocales[0], 'en-US');
  });
});

describe('Language negotiation with arguments', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.requestLocales('pl');
  });

  it('sets the correct fallback chain', function() {
    assert.strictEqual(ctx.supportedLocales.length, 2);
    assert.strictEqual(ctx.supportedLocales[0], 'pl');
    assert.strictEqual(ctx.supportedLocales[1], 'en-US');
  });
});
