var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;
var Promise = require('../../../lib/l20n/promise').Promise;

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('Language negotiation', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
  });

  it('uses the default', function(done) {
    whenReady(ctx, function() {
      ctx.get('foo').should.equal('Foo pl');
      done();
    });
    ctx.freeze();
  });
  it('can be overridden', function(done) {
    ctx.registerLocaleNegotiator(function(available, requested, def) {
      return ['de'];
    });
    whenReady(ctx, function() {
      ctx.get('foo').should.equal('Foo de');
      done();
    });
    ctx.freeze();
  });
  it('can return a promise', function(done) {
    ctx.registerLocaleNegotiator(function(available, requested, def) {
      var promise = new Promise();
      setTimeout(function() {
        promise.fulfill(['de']);
      });
      return promise;
    });
    whenReady(ctx, function() {
      ctx.get('foo').should.equal('Foo de');
      done();
    });
    ctx.freeze();
  });
});
