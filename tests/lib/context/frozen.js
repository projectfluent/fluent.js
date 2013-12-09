var Context = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/context').Context :
  require('../../../lib/l20n/context').Context;

function whenReady(ctx, callback) {
  'use strict';
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('A non-frozen context', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
  });

  it('should throw on getSync', function() {
    (function(){
      ctx.getSync('dummy');
    }).should.throw(/Context not ready/);
  });
  it('should throw on getEntitySync', function() {
    (function(){
      ctx.getEntitySync('dummy');
    }).should.throw(/Context not ready/);
  });
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['dummy'], function() {});
    }).should.not.throw();
  });
});

describe('A frozen, non-ready context', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var ctx;
  beforeEach(function() {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
    ctx.requestLocales();
  });

  it('should throw on addResource', function() {
    (function(){
      ctx.addResource('<dummy "Dummy">');
    }).should.throw(/Context is frozen/);
  });
  it('should throw on linkResource', function() {
    (function(){
      ctx.linkResource('./fixtures/en-US.l20n');
    }).should.throw(/Context is frozen/);
  });
  it('should throw on requestLocales', function() {
    (function(){
      ctx.requestLocales();
    }).should.throw(/Context not ready/);
  });
  it('should throw on getSync', function() {
    (function(){
      ctx.getSync('dummy');
    }).should.throw(/Context not ready/);
  });
  it('should throw on getEntitySync', function() {
    (function(){
      ctx.getEntitySync('dummy');
    }).should.throw(/Context not ready/);
  });
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['dummy'], function() {});
    }).should.not.throw();
  });
  it('should throw on registerLocales', function() {
    (function(){
      ctx.registerLocales('en-US');
    }).should.throw(/Context is frozen/);
  });
  it('should throw on registerLocaleNegotiator', function() {
    (function(){
      ctx.registerLocaleNegotiator(function() {});
    }).should.throw(/Context is frozen/);
  });
  it('should throw on requestLocales', function() {
    (function(){
      ctx.requestLocales('en-US');
    }).should.throw(/Context not ready/);
  });
});

describe('A frozen, ready context', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var ctx;
  beforeEach(function(done) {
    ctx = new Context();
    ctx.addResource('<dummy "Dummy">');
    ctx.addEventListener('ready', function onReady() {
      ctx.removeEventListener('ready', onReady);
      done();
    });
    ctx.requestLocales();
  });

  it('should throw on addResource', function() {
    (function(){
      ctx.addResource('<dummy "Dummy">');
    }).should.throw(/Context is frozen/);
  });
  it('should throw on linkResource', function() {
    (function(){
      ctx.linkResource('./fixtures/en-US.l20n');
    }).should.throw(/Context is frozen/);
  });
  it('should not throw on getSync of a known entity', function() {
    (function(){
      ctx.getSync('dummy');
    }).should.not.throw();
  });
  it('should not throw on getSync of an unknown entity', function() {
    (function(){
      ctx.getSync('missing');
    }).should.not.throw();
  });
  it('should not throw on getEntitySync of a known entity', function() {
    (function(){
      ctx.getEntitySync('dummy');
    }).should.not.throw();
  });
  it('should not throw on getEntitySync of an unknown entity', function() {
    (function(){
      ctx.getEntitySync('missing');
    }).should.not.throw();
  });
  it('should not throw on localize', function() {
    (function(){
      ctx.localize(['dummy'], function() {});
    }).should.not.throw();
  });
  it('should throw on registerLocales', function() {
    (function(){
      ctx.registerLocales('en-US');
    }).should.throw(/Context is frozen/);
  });
  it('should throw on registerLocaleNegotiator', function() {
    (function(){
      ctx.registerLocales('en-US');
    }).should.throw(/Context is frozen/);
  });
  it('should not throw on requestLocales', function() {
    (function(){
      ctx.requestLocales('en-US');
    }).should.not.throw();
  });
});

describe('A frozen, ready context', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var ctx;
  beforeEach(function(done) {
    ctx = new Context();
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.l20n';
    });
    whenReady(ctx, done);
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('en-US');
  });

  it('should return translations for the current built fallback chain ', function() {
    // Bug 942183 - Error when localizeNode is done quickly after 
    // requestLocales https://bugzil.la/942183
    // Changing locales triggers the build process for the 'pl' locale.  
    // However, synchronous methods called right after the change should still 
    // return translations for the previous fallback chain
    ctx.requestLocales('pl');
    var entity = ctx.getEntitySync('foo');
    entity.value.should.equal('Foo en-US');
    entity.locale.should.equal('en-US');
  });
});
