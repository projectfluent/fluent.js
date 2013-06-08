var Context = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n/context').Context
  : require('../../lib/l20n/context').Context;

describe('A non-frozen context', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
  });

  it('should throw on get', function() {
    (function(){
      ctx.get('brandName');
    }).should.throw(/Context not ready/);
  })
  it('should throw on getEntity', function() {
    (function(){
      ctx.getEntity('brandName');
    }).should.throw(/Context not ready/);
  })
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['brandName'], function(l10n) {});
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

  it('should throw on get', function() {
    (function(){
      ctx.get('brandName');
    }).should.throw(/Context not ready/);
  })
  it('should throw on getEntity', function() {
    (function(){
      ctx.getEntity('brandName');
    }).should.throw(/Context not ready/);
  })
  it('should throw on registerLocales', function() {
    (function(){
      ctx.registerLocales(['en-US']);
    }).should.throw(/Context not ready/);
  })
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['brandName'], function(l10n) {});
    }).should.not.throw();
  })
});
