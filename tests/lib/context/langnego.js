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

describe('Language negotiation without registerLocales', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.addResource('<foo "Foo">');
    ctx.requestLocales();
    whenReady(ctx, done);
  });

  it('used the i-default locale', function() {
    ctx.supportedLocales.should.have.property('length', 1);
    ctx.supportedLocales[0].should.equal('i-default');
  });
});

describe('Language negotiation with registerLocales', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('csb', 'pl', 'de');
    whenReady(ctx, done);
  });

  it('sets the correct fallback chain', function() {
    ctx.supportedLocales.should.have.property('length', 3);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('de');
    ctx.supportedLocales[2].should.equal('en-US');
  });
});

describe('supportedLocales', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('csb', 'pl', 'de');
    whenReady(ctx, done);
  });

  it('cannot be overwritten', function() {
    ctx.supportedLocales = 42;
    ctx.supportedLocales.should.have.property('length', 3);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('de');
    ctx.supportedLocales[2].should.equal('en-US');
  });

  it('cannot be deleted', function() {
    delete ctx.supportedLocales;
    ctx.supportedLocales.should.have.property('length', 3);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('de');
    ctx.supportedLocales[2].should.equal('en-US');
  });

  it('cannot be redefined', function() {
    (function() {
      Object.defineProperty(ctx, 'supportedLocales', {
        value: 42
      });
    }).should.throw(/Cannot redefine property/);
  });
});

describe('Language negotiator', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
  });

  it('is Intl.prioritizeLocales by default', function(done) {
    whenReady(ctx, function() {
      ctx.get('foo').should.equal('Foo pl');
      done();
    });
    ctx.requestLocales('pl');
  });
  it('can be overridden', function(done) {
    ctx.registerLocaleNegotiator(function(available, requested, def) {
      return ['de'];
    });
    whenReady(ctx, function() {
      ctx.get('foo').should.equal('Foo de');
      done();
    });
    ctx.requestLocales('pl');
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
    ctx.requestLocales('pl');
  });
});
