'use strict';

var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('A non-loading context', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/strings.properties');
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
});

describe('A loading, non-ready context', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/strings.properties');
    ctx.requestLocales();
  });

  it('should throw on requestLocales', function() {
    (function(){
      ctx.requestLocales();
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
  it('should throw on requestLocales', function() {
    (function(){
      ctx.requestLocales('en-US');
    }).should.throw(/Context not ready/);
  })
});

describe('A loading, ready context', function() {
  var ctx;
  beforeEach(function(done) {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/strings.properties');
    ctx.addEventListener('ready', function onReady() {
      ctx.removeEventListener('ready', onReady);
      done();
    });
    ctx.requestLocales();
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
  it('should not throw on requestLocales', function() {
    (function(){
      ctx.requestLocales('en-US');
    }).should.not.throw();
  })
});

describe('A loading, ready context', function() {
  var ctx;
  beforeEach(function(done) {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/{{locale}}.properties');
    whenReady(ctx, done);
    ctx.requestLocales('en-US');
  });

  it('should return translations for the current built fallback chain ', function() {
    // Bug 942183 - Error when localizeNode is done quickly after
    // requestLocales https://bugzil.la/942183
    // Changing locales triggers the build process for the 'pl' locale.
    // However, synchronous methods called right after the change should still
    // return translations for the previous fallback chain
    ctx.requestLocales('pl');
    var entity = ctx.getEntity('foo');
    entity.should.equal('Foo en-US');
  });
});
