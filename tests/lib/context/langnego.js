var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;

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
    whenReady(ctx, done);
    ctx.addResource('foo=Foo');
    ctx.requestLocales();
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
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.properties';
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl', 'de');
  });

  it('sets the correct fallback chain', function() {
    ctx.supportedLocales.should.have.property('length', 2);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('en-US');
  });
});

describe('supportedLocales', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.properties';
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl', 'de');
  });

  it('cannot be overwritten', function() {
    ctx.supportedLocales = 42;
    ctx.supportedLocales.should.have.property('length', 2);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('en-US');
  });

  it('cannot be deleted', function() {
    delete ctx.supportedLocales;
    ctx.supportedLocales.should.have.property('length', 2);
    ctx.supportedLocales[0].should.equal('pl');
    ctx.supportedLocales[1].should.equal('en-US');
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
      return __dirname + '/fixtures/' + locale + '.properties';
    });
  });

  it('is Intl.prioritizeLocales by default', function(done) {
    whenReady(ctx, function() {
      ctx.get('foo').should.equal('Foo pl');
      done();
    });
    ctx.requestLocales('pl');
  });
});

describe('registerLocales errors', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
  });

  it('should not throw if the lang code is a string', function() {
    (function() {
      ctx.registerLocales('en-US');
    }).should.not.throw();
  })
  it('should not throw if there are no arguments', function() {
    (function() {
      ctx.registerLocales();
    }).should.not.throw();
  })
  it('should not throw if the first argument is undefined', function() {
    (function() {
      ctx.registerLocales(undefined);
    }).should.not.throw();
  })
  it('should throw otherwise', function() {
    (function() {
      ctx.registerLocales(null);
    }).should.throw(/Language codes must be strings/);
    (function() {
      ctx.registerLocales(false);
    }).should.throw(/Language codes must be strings/);
    (function() {
      ctx.registerLocales(7);
    }).should.throw(/Language codes must be strings/);
    (function() {
      ctx.registerLocales(true);
    }).should.throw(/Language codes must be strings/);
  })
});

describe('requestLocales errors', function() {
  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('dummy=Dummy');
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
  });

  it('should not throw if the lang code is a string', function() {
    (function() {
      ctx.requestLocales('en-US');
    }).should.not.throw();
  })
  it('should not throw if there are no arguments', function() {
    (function() {
      ctx.requestLocales();
    }).should.not.throw();
  })
  it('should throw if the argument is undefined', function() {
    (function() {
      ctx.requestLocales(undefined);
    }).should.throw(/Language codes must be strings/);
  })
  it('should throw if the argument is null', function() {
    (function() {
      ctx.requestLocales(null);
    }).should.throw(/Language codes must be strings/);
  })
  it('should throw if the argument is a boolean', function() {
    (function() {
      ctx.requestLocales(false);
    }).should.throw(/Language codes must be strings/);
  })
  it('should throw if the argument is a number', function() {
    (function() {
      ctx.requestLocales(7);
    }).should.throw(/Language codes must be strings/);
  })
});
