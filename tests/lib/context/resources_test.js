if (typeof navigator !== 'undefined') {
  var L10n = navigator.mozL10n._getInternalAPI();
  var Context = L10n.Context;
  var path = 'http://gallery.gaiamobile.org:8080/test/unit/l10n/context';
} else {
  var Context = process.env.L20N_COV
    ? require('../../../build/cov/lib/l20n/context').Context
    : require('../../../lib/l20n/context').Context;
  var path = __dirname;
}

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

    ctx.resLinks.push(path + '/fixtures/en-US.properties');
    ctx.resLinks.push(path + '/fixtures/missing.properties');
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
    ctx.resLinks.push(path + '/fixtures/missing.properties');
    ctx.resLinks.push(path + '/fixtures/another.properties');
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
});
