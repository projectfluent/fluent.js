var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;

describe('A non-frozen context', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
  });

  it('should throw on get', function() {
    (function(){
      ctx.get('dummy');
    }).should.throw(/Context not ready/);
  })
  it('should throw on getEntity', function() {
    (function(){
      ctx.getEntity('dummy');
    }).should.throw(/Context not ready/);
  })
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['dummy'], function(l10n) {});
    }).should.not.throw();
  })
});

describe('A frozen, non-ready context', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
    ctx.freeze();
  });

  it('should throw on freeze', function() {
    (function(){
      ctx.freeze();
    }).should.throw(/Context not ready/);
  })
  it('should throw on get', function() {
    (function(){
      ctx.get('dummy');
    }).should.throw(/Context not ready/);
  })
  it('should throw on getEntity', function() {
    (function(){
      ctx.getEntity('dummy');
    }).should.throw(/Context not ready/);
  })
  it('should throw on registerLocales', function() {
    (function(){
      ctx.registerLocales('en-US');
    }).should.throw(/Context not ready/);
  })
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['dummy'], function(l10n) {});
    }).should.not.throw();
  })
});

describe('A frozen, ready context', function() {
  var ctx;
  beforeEach(function(done) {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
    ctx.addEventListener('ready', function onReady() {
      ctx.removeEventListener('ready', onReady);
      done();
    });
    ctx.freeze();
  });

  it('should not throw on get of a known entity', function() {
    (function(){
      ctx.get('dummy');
    }).should.not.throw();
  })
  it('should not throw on get of an unknown entity', function() {
    (function(){
      ctx.get('missing');
    }).should.not.throw();
  })
  it('should not throw on getEntity of a known entity', function() {
    (function(){
      ctx.getEntity('dummy');
    }).should.not.throw();
  })
  it('should not throw on getEntity of an unknown entity', function() {
    (function(){
      ctx.getEntity('missing');
    }).should.not.throw();
  })
  it('should not throw on registerLocales', function() {
    (function(){
      ctx.registerLocales('en-US');
    }).should.not.throw();
  })
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['dummy'], function(l10n) {});
    }).should.not.throw();
  })
});
