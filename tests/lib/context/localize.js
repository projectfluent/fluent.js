var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('Asynchronous ctx.localize', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<foo "Foo">');
  });

  it('should fire when context becomes ready', function(done) {
    var now = false;
    ctx.localize(['foo'], function(l10n) {
      if (now) {
        done();
      }
    });
    ctx.freeze();
    now = true;
  });
  it('should have reason.locales', function(done) {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.should.have.property('locales');
      done();
    });
    ctx.freeze();
  });
  it('should have empty reason.locales in monolingual mode', function(done) {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales.should.have.property('length', 0);
      done();
    });
    ctx.freeze();
  });
  it('should have non-empty reason.locales in multilingual mode', function(done) {
    ctx.registerLocales('pl', 'en-US');
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0].should.equal('pl');
      done();
    });
    ctx.freeze();
  });
  it('should fire again when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
    ctx.freeze();
    whenReady(ctx, function() {
      ctx.registerLocales('de', 'en-US');
    });
  });
  it('should have reason.locales when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.should.have.property('locales');
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
    ctx.freeze();
    whenReady(ctx, function() {
      ctx.registerLocales('de', 'en-US');
    });
  });
  it('should have empty reason.locales when switching to monolingual', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales.should.have.property('length', 0);
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
    ctx.freeze();
    whenReady(ctx, function() {
      ctx.registerLocales();
    });
  });
  it('should have non-empty reason.locales when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales[0].should.equal('de');
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
    ctx.freeze();
    whenReady(ctx, function() {
      ctx.registerLocales('de', 'en-US');
    });
  });
});

describe('Synchronous ctx.localize in monolingual mode', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.addResource('<foo "Foo">');
    ctx.freeze();
    whenReady(ctx, done);
  });
  it('should fire immediately', function(done) {
    var now = true;
    ctx.localize(['foo'], function(l10n) {
      if (now) {
        done();
      }
    });
    now = false;
  });
  it('should have reason.locales', function() {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.should.have.property('locales');
    });
  });
  it('should have empty reason.locales', function() {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales.should.have.property('length', 0);
    });
  });
  it('should fire again when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
  });
  it('should have non-empty reason.locales when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales[0].should.equal('pl');
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
  });
});

describe('Synchronous ctx.localize in multilingual mode', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.registerLocales('pl', 'en-US');
    ctx.addResource('<foo "Foo">');
    ctx.freeze();
    whenReady(ctx, done);
  });
  it('should fire immediately', function(done) {
    var now = true;
    ctx.localize(['foo'], function(l10n) {
      if (now) {
        done();
      }
    });
    now = false;
  });
  it('should have reason.locales', function() {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.should.have.property('locales');
    });
  });
  it('should have non-empty reason.locales', function() {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0].should.equal('pl');
    });
  });
  it('should fire again when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        done();
      }
    });
    ctx.registerLocales('pl', 'en-US');
  });
  it('should have non-empty reason.locales when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales[0].should.equal('de');
        done();
      }
    });
    ctx.registerLocales('de', 'en-US');
  });
  it('should have empty reason.locales when switching to monolingual', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales.should.have.property('length', 0);
        done();
      }
    });
    ctx.registerLocales();
  });

describe('l10n object passed to ctx.localize\'s callback', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.registerLocales('pl', 'en-US');
    ctx.addResource('<foo "Foo">');
    ctx.freeze();
    whenReady(ctx, done);
  });

  it('should protect reason.locales from being changed by the callback', function() {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0] = 'de';
    });
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0].should.equal('pl');
    });
  });
});

});
