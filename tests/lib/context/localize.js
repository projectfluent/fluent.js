var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;

var RetranslationManager = require('../../../lib/l20n/retranslation').RetranslationManager;
var Global = require('../../../lib/l20n/platform/globals').Global;
var EventEmitter = require('../../../lib/l20n/events').EventEmitter;

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
    ctx.requestLocales();
    now = true;
  });
  it('should have reason.locales', function(done) {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.should.have.property('locales');
      done();
    });
    ctx.requestLocales();
  });
  it('should have i-default in reason.locales in monolingual mode', function(done) {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0].should.equal('i-default');
      done();
    });
    ctx.requestLocales();
  });
  it('should have non-empty reason.locales in multilingual mode', function(done) {
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0].should.equal('pl');
      done();
    });
    ctx.requestLocales('pl');
  });
  it('should fire again when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        done();
      }
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      ctx.requestLocales('de');
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
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      ctx.requestLocales('de');
    });
  });
  it('should use the default when requesting no specific locales', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales[0].should.equal('en-US');
        done();
      }
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      ctx.requestLocales();
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
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl');
    whenReady(ctx, function() {
      ctx.requestLocales('de');
    });
  });
  it('should be gced after inner .stop', function(done) {
    var conditions = [
      false, // global has been called
      false, // global has been activated
      false, // localize has been called for the first time
      false, // localize has been triggered by global
      false, // stop deactivated the global
      false, // localize has not been triggered by global
    ];
    var ee = new EventEmitter();

    function ExampleGlobal() {
      Global.call(this);
      this.id = 'example';
      this._get = _get;
      this.activate = activate;
      this.deactivate = deactivate;

      var self = this;

      function _get() {
        if (!conditions[0]) {
          conditions[0] = true;
        }
        return "foo";
      }

      function activate() {
        if (!this.isActive) {
          conditions[1] = true;
          ee.addEventListener('trigger', onchange); 
        }
      }

      function deactivate() {
        conditions[4] = true;
        ee.removeEventListener('trigger', onchange);
        this.isActive = false;
      }

      function onchange() {
        self._emitter.emit('change', self.id);
      }
    }
    ExampleGlobal.prototype = Object.create(Global.prototype);
    ExampleGlobal.prototype.constructor = ExampleGlobal;
    RetranslationManager.registerGlobal(ExampleGlobal);
    var ctx = new Context();

    ctx.addResource('<foo2 "Foo {{ @example }}">');
    ctx.addEventListener('error', function(e){console.log(e);});
    ctx.requestLocales();

    ctx.localize(['foo2'], function(l10n) {
      if (!conditions[2]) {
        conditions[2] = true;
        ee.emit('trigger');
      } else if (!conditions[3]) {
        conditions[3] = true;
        l10n.stop();
        conditions[5] = true;
        ee.emit('trigger');
        if (conditions.every(function(e){return e;})) {
          done();
        }
      } else {
        conditions[5] = false;
      }
    });
  });
  it('should be gced after outer .stop', function(done) {
    var conditions = [
      false, // global has been called
      false, // global has been activated
      false, // localize has been called for the first time
      false, // localize has been triggered by global
      false, // stop deactivated the global
      false, // localize has not been triggered by global
    ];
    var ee = new EventEmitter();

    function ExampleGlobal() {
      Global.call(this);
      this.id = 'example';
      this._get = _get;
      this.activate = activate;
      this.deactivate = deactivate;

      var self = this;

      function _get() {
        if (!conditions[0]) {
          conditions[0] = true;
        }
        return "foo";
      }

      function activate() {
        if (!this.isActive) {
          conditions[1] = true;
          ee.addEventListener('trigger', onchange); 
        }
      }

      function deactivate() {
        conditions[4] = true;
        ee.removeEventListener('trigger', onchange);
        this.isActive = false;
      }

      function onchange() {
        self._emitter.emit('change', self.id);
      }
    }
    ExampleGlobal.prototype = Object.create(Global.prototype);
    ExampleGlobal.prototype.constructor = ExampleGlobal;
    RetranslationManager.registerGlobal(ExampleGlobal);
    var ctx = new Context();

    ctx.addResource('<foo2 "Foo {{ @example }}">');
    ctx.addEventListener('error', function(e){console.log(e);});
    ctx.requestLocales();

    var handler = ctx.localize(['foo2'], function(l10n) {
      if (!conditions[2]) {
        conditions[2] = true;
        ee.emit('trigger');
      } else if (!conditions[3]) {
        conditions[3] = true;
        handler.stop();
        conditions[5] = true;
        ee.emit('trigger');
        if (conditions.every(function(e){return e;})) {
          done();
        }
      } else {
        conditions[5] = false;
      }
    });
  });
});

describe('Synchronous ctx.localize in monolingual mode', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.addResource('<foo "Foo">');
    ctx.requestLocales();
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
  it('should have i-default in reason.locales', function() {
    ctx.localize(['foo'], function(l10n) {
      l10n.reason.locales[0].should.equal('i-default');
    });
  });
});

describe('Synchronous ctx.localize in multilingual mode', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.addResource('<foo "Foo">');
    ctx.requestLocales('pl');
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
    ctx.requestLocales('de');
  });
  it('should have non-empty reason.locales when locales change', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales[0].should.equal('de');
        done();
      }
    });
    ctx.requestLocales('de');
  });
  it('should use the default lcoale if no locales have been requested', function(done) {
    var i = 0;
    ctx.localize(['foo'], function(l10n) {
      if (i++ == 1) {
        l10n.reason.locales[0].should.equal('en-US');
        done();
      }
    });
    ctx.requestLocales();
  });
});

describe('l10n object passed to ctx.localize\'s callback', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.addResource('<foo "Foo">');
    ctx.requestLocales('pl');
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
