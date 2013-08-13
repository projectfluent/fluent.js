var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('ctx.ready', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
  });

  it('should fire asynchronously when context is ready', function(done) {
    ctx.ready(function() {
      done();
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    ctx.freeze();
  });
  it('should fire asynchronously when language changes', function(done) {
    var now = false;
    ctx.ready(function() {
      if (now) {
        done();
      }
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      now = true;
      ctx.requestLocales('de');
    });
    ctx.freeze();
  });
  it('should fire synchronously when context is ready', function(done) {
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      ctx.ready(function() {
        done();
      });
    });
    ctx.freeze();
  });
  it('should fire synchronously when language changes', function(done) {
    var now = false;
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      ctx.ready(function() {
        if (now) {
          done();
        }
      });
      setTimeout(function() {
        now = true;
        ctx.requestLocales('de');
      });
    });
    ctx.freeze();
  });
});
