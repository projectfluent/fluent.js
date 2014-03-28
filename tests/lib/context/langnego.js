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

describe('Language negotiation without arguments', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('used the en-US locale', function() {
    ctx.supportedLocales.should.have.property('length', 1);
    ctx.supportedLocales[0].should.equal('en-US');
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
    ctx.supportedLocales.should.have.property('length', 2);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('en-US');
  });
});
