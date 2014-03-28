'use strict';

var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;
var Parser = require('../../../lib/l20n/parser').Parser;
var io = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/platform/io')
  : require('../../../lib/l20n/platform/io');

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('Missing resources', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/en-US.properties');
    ctx.resLinks.push(__dirname + '/fixtures/missing.properties');
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
});

describe('No valid resources', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/missing.properties');
    ctx.resLinks.push(__dirname + '/fixtures/another.properties');
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
});
