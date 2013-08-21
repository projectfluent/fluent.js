var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;
var Parser = require('../../../lib/l20n/parser').Parser;
var io = require('../../../lib/l20n/platform/io');

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('A context without any resources', function() {
  var ctx = new Context();
  it('should throw on requestLocales', function() {
    ctx.requestLocales.should.throw(/Context has no resources/);
  })
});

describe('addResource without registerLocales', function() {
  var ctx = new Context();
  ctx.addResource('<foo "Foo">');
  ctx.addResource('<bar "Bar">');

  before(function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('should add the first resource to i-default', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo');
    val.should.have.property('locale', 'i-default');
  })
  it('should add the second resource to i-default', function() {
    var val = ctx.getEntity('bar');
    val.value.should.equal('Bar');
    val.should.have.property('locale', 'i-default');
  })
});

describe('addResource with registerLocales', function() {
  var ctx = new Context();
  ctx.addResource('<foo "Foo">');

  before(function(done) {
    whenReady(ctx, done);
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
  });

  it('should add to pl', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo');
    val.should.have.property('locale', 'pl')
  })
  it('should change locale without an error', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales('de');
  })
  it('should add to en-US', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo');
    val.should.have.property('locale', 'de')
  })
});

describe('linkResource(String) without registerLocales', function() {
  var ctx = new Context();
  ctx.linkResource(__dirname + '/fixtures/strings.lol');

  before(function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('should add to i-default', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo');
    val.should.have.property('locale', 'i-default');
  })
});

describe('linkResource(String) with registerLocales', function() {
  var ctx = new Context();
  ctx.linkResource(__dirname + '/fixtures/strings.lol');

  before(function(done) {
    whenReady(ctx, done);
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
  });

  it('should add to pl', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo');
    val.should.have.property('locale', 'pl')
  })
  it('should change locale without an error', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales('de');
  })
  it('should add to en-US', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo');
    val.should.have.property('locale', 'de')
  })
});

describe('linkResource(Function) without registerLocales', function() {
  var ctx = new Context();
  ctx.linkResource(function(locale) {
    return __dirname + '/fixtures/' + locale + '.lol';
  });

  before(function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('should add to i-default', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo i');
    val.should.have.property('locale', 'i-default')
  })

});

describe('linkResource(Function) with registerLocales', function() {
  var ctx = new Context();
  ctx.linkResource(function(locale) {
    return __dirname + '/fixtures/' + locale + '.lol';
  });

  before(function(done) {
    whenReady(ctx, done);
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
  });

  it('should add to pl', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo pl');
    val.should.have.property('locale', 'pl')
  })
  it('should change locale without an error', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales('en-US');
  })
  it('should add to en-US', function() {
    var val = ctx.getEntity('foo');
    val.value.should.equal('Foo en-US');
    val.should.have.property('locale', 'en-US')
  })
});

describe('Parser errors', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
  it('should emit a ParserError', function(done) {
    ctx.addEventListener('error', function(e) {
      e.should.be.an.instanceOf(Parser.Error);
      done();
    });
    ctx.requestLocales();
  });
});

describe('Missing resources', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<foo "Foo">');
    ctx.linkResource(__dirname + '/fixtures/missing.lol');
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
  it('should emit a warning', function(done) {
    ctx.addEventListener('warning', function(e) {
      e.should.be.an.instanceOf(io.Error);
      e.should.match(/missing.lol/);
      done();
    });
    ctx.requestLocales();
  });
});

describe('Recursive imports', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<foo "Foo">');
    ctx.linkResource(__dirname + '/fixtures/recursive.lol');
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
  it('should emit an error', function(done) {
    ctx.addEventListener('error', function(e) {
      e.should.be.an.instanceOf(Context.Error);
      e.should.match(/Too many nested/);
      done();
    });
    ctx.requestLocales();
  });
});

// XXX Bug 908780 - Decide what to do when all resources in a locale are 
// missing or broken
// https://bugzilla.mozilla.org/show_bug.cgi?id=908780
describe('No valid resources', function() {
  var ctx;

  beforeEach(function() {
    ctx = new Context();
    ctx.linkResource(__dirname + '/fixtures/missing.lol');
    ctx.linkResource(__dirname + '/fixtures/recursive.lol');
  });

  it('should get ready', function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });
  it('should emit two errors', function(done) {
    var count = 0;
    ctx.addEventListener('error', function(e) {
      count++;
      if (count >= 2)
        done();
    });
    ctx.requestLocales();
  });
  it('should emit an error about recursion', function(done) {
    ctx.addEventListener('error', function(e) {
      e.should.be.an.instanceOf(Context.Error);
      if (/Too many nested/.test(e.message))
        done();
    });
    ctx.requestLocales();
  });
  it('should emit an error about no valid resources', function(done) {
    ctx.addEventListener('error', function(e) {
      e.should.be.an.instanceOf(Context.Error);
      if (/no valid resources/.test(e.message))
        done();
    });
    ctx.requestLocales();
  });
});
