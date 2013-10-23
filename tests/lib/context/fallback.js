var Context = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/context').Context :
  require('../../../lib/l20n/context').Context;
var Compiler = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/compiler').Compiler :
  require('../../../lib/l20n/compiler').Compiler;

function whenReady(ctx, callback) {
  'use strict';
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}


describe('No locale fallback', function() {
  'use strict';
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
    ctx.registerLocales('pl');
    ctx.requestLocales('pl');
  });

  it('[e] (translation exists)', function() {
    var entity = ctx.getEntitySync('e');
    entity.value.should.equal('E pl');
    entity.should.have.property('locale', 'pl');
  });

  it('[v] (ValueError)', function() {
    var entity = ctx.getEntitySync('v');
    entity.value.should.equal('V {{ boo }} pl');
    entity.should.have.property('locale', 'pl');
  });
  it('[v] emits 2 errors', function(done) {
    var count = 0;
    ctx.addEventListener('error', function() {
      count++;
      if (count >= 2) {
        done();
      }
    });
    ctx.getSync('v');
  });
  it('[v] emits a TranslationError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.TranslationError && e.locale === 'pl') {
        done();
      }
    });
    ctx.getSync('v');
  });
  it('[v] emits a RuntimeError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
        done();
      }
    });
    ctx.getSync('v');
  });
  it('[v] emits 1 warning', function(done) {
    var count = 0;
    ctx.addEventListener('warning', function() {
      count++;
      if (count >= 1) {
        done();
      }
    });
    ctx.getSync('v');
  });
  it('[v] re-emits the ValueError', function(done) {
    ctx.addEventListener('warning', function(e) {
      if (e instanceof Compiler.ValueError) {
        done();
      }
    });
    ctx.getSync('v');
  });

  it('[i] (IndexError)', function() {
    var entity = ctx.getEntitySync('i');
    entity.value.should.equal('i');
    entity.should.have.property('locale', null);
  });
  it('[i] emits 2 errors', function(done) {
    var count = 0;
    ctx.addEventListener('error', function() {
      count++;
      if (count >= 2) {
        done();
      }
    });
    ctx.getSync('i');
  });
  it('[i] emits a TranslationError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.TranslationError && e.locale === 'pl') {
        done();
      }
    });
    ctx.getSync('v');
  });
  it('[i] emits a RuntimeError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
        done();
      }
    });
    ctx.getSync('v');
  });
  it('[i] emits 1 warning', function(done) {
    var count = 0;
    ctx.addEventListener('warning', function() {
      count++;
      if (count >= 1) {
        done();
      }
    });
    ctx.getSync('i');
  });
  it('[i] re-emits the IndexError', function(done) {
    ctx.addEventListener('warning', function(e) {
      if (e instanceof Compiler.IndexError) {
        done();
      }
    });
    ctx.getSync('i');
  });

  it('[m] (translation missing)', function() {
    var entity = ctx.getEntitySync('m');
    entity.value.should.equal('m');
    entity.should.have.property('locale', null);
  });
  it('[m] emits 1 error', function(done) {
    var count = 0;
    ctx.addEventListener('error', function() {
      count++;
      if (count >= 1) {
        done();
      }
    });
    ctx.getSync('m');
  });
  it('[m] emits a RuntimeError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
        done();
      }
    });
    ctx.getSync('m');
  });
  it('[m] emits 1 warning', function(done) {
    var count = 0;
    ctx.addEventListener('warning', function() {
      count++;
      if (count >= 1) {
        done();
      }
    });
    ctx.getSync('m');
  });
  it('[m] emits a warning', function(done) {
    ctx.addEventListener('warning', function(e) {
      if (e instanceof Context.TranslationError && e.locale === 'pl') {
        done();
      }
    });
    ctx.getSync('m');
  });
});

describe('One fallback locale', function() {
  'use strict';
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
    ctx.registerLocales('de', ['de', 'pl']);
    ctx.requestLocales('pl', 'de');
  });

  describe('Translation in the first locale exists and is OK', function() {
    it('[e]', function() {
      var entity = ctx.getEntitySync('e');
      entity.value.should.equal('E pl');
      entity.should.have.property('locale', 'pl');
    });
  });

  describe('ValueError in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[ve]', function() {
        var entity = ctx.getEntitySync('ve');
        entity.value.should.equal('VE de');
        entity.should.have.property('locale', 'de');
      });
      it('[ve] emits 1 error', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 1) {
            done();
          }
        });
        ctx.getSync('ve');
      });
      it('[ve] emits a TranslationError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('ve');
      });
      it('[ve] emits 1 warning', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 1) {
            done();
          }
        });
        ctx.getSync('ve');
      });
      it('[ve] re-emits the ValueError', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'VE {{ boo }} pl') {
            done();
          }
        });
        ctx.getSync('ve');
      });
    });

    describe('ValueError in second locale:', function() {
      it('[vv]', function() {
        var entity = ctx.getEntitySync('vv');
        entity.value.should.equal('VV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
      it('[vv] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 3) {
            done();
          }
        });
        ctx.getSync('vv');
      });
      it('[vv] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('vv');
      });
      it('[vv] emits a TranslationError for the first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('vv');
      });
      it('[vv] emits a TranslationError for the second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('vv');
      });
      it('[vv] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('vv');
      });
      it('[vv] re-emits the ValueError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'VV {{ boo }} pl') {
            done();
          }
        });
        ctx.getSync('vv');
      });
      it('[vv] re-emits the ValueError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'VV {{ boo }} de') {
            done();
          }
        });
        ctx.getSync('vv');
      });
    });

    describe('IndexError in second locale:', function() {
      it('[vi]', function() {
        var entity = ctx.getEntitySync('vi');
        entity.value.should.equal('VI {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
      it('[vi] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 3) {
            done();
          }
        });
        ctx.getSync('vi');
      });
      it('[vi] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('vi');
      });
      it('[vi] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('vi');
      });
      it('[vi] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('vi');
      });
      it('[vi] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('vi');
      });
      it('[vi] re-emits the ValueError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'VI {{ boo }} pl') {
            done();
          }
        });
        ctx.getSync('vi');
      });
      it('[vi] re-emits the IndexError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) {
            done();
          }
        });
        ctx.getSync('vi');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[vm]', function() {
        var entity = ctx.getEntitySync('vm');
        entity.value.should.equal('VM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
      it('[vm] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('vm');
      });
      it('[vm] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('vm');
      });
      it('[vm] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('vm');
      });
      it('[vm] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('vm');
      });
      it('[vm] emits a warning for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('vm');
      });
      it('[vm] re-emits the ValueError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'VM {{ boo }} pl') {
            done();
          }
        });
        ctx.getSync('vm');
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('Entity exists in second locale', function() {
      it('[ie]', function() {
        var entity = ctx.getEntitySync('ie');
        entity.value.should.equal('IE de');
        entity.should.have.property('locale', 'de');
      });
      it('[ie] emits 1 error', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 1) {
            done();
          }
        });
        ctx.getSync('ie');
      });
      it('[ie] emits a TranslationError for the first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('ie');
      });
      it('[ie] emits 1 warning', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 1) {
            done();
          }
        });
        ctx.getSync('ie');
      });
      it('[ie] re-emits the IndexError', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) {
            done();
          }
        });
        ctx.getSync('ie');
      });
    });

    describe('ValueError in second locale', function() {
      it('[iv]', function() {
        var entity = ctx.getEntitySync('iv');
        entity.value.should.equal('IV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
      it('[iv] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 3) {
            done();
          }
        });
        ctx.getSync('iv');
      });
      it('[iv] emits RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('iv');
      });
      it('[iv] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('iv');
      });
      it('[iv] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('iv');
      });
      it('[iv] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('iv');
      });
      it('[iv] re-emits the IndexError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) {
            done();
          }
        });
        ctx.getSync('iv');
      });
      it('[iv] re-emits the ValueError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'IV {{ boo }} de') {
            done();
          }
        });
        ctx.getSync('iv');
      });
    });

    describe('IndexError in second locale', function() {
      it('[ii]', function() {
        var entity = ctx.getEntitySync('ii');
        entity.value.should.equal('ii');
        entity.should.have.property('locale', null);
      });
      it('[ii] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 3) {
            done();
          }
        });
        ctx.getSync('ii');
      });
      it('[ii] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('ii');
      });
      it('[ii] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('ii');
      });
      it('[ii] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('ii');
      });
      it('[ii] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('ii');
      });
      it('[ii] re-emits the IndexErrors for both locales', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (e instanceof Compiler.IndexError && count >= 2) {
            done();
          }
        });
        ctx.getSync('ii');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[im]', function() {
        var entity = ctx.getEntitySync('im');
        entity.value.should.equal('im');
        entity.should.have.property('locale', null);
      });
      it('[im] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('im');
      });
      it('[im] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('im');
      });
      it('[im] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('im');
      });
      it('[im] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('im');
      });
      it('[im] emits a warning for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('im');
      });
      it('[im] re-emits the IndexError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) {
            done();
          }
        });
        ctx.getSync('im');
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[me]', function() {
        var entity = ctx.getEntitySync('me');
        entity.value.should.equal('ME de');
        entity.should.have.property('locale', 'de');
      });
      it('[me] emits 1 warning', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 1) {
            done();
          }
        });
        ctx.getSync('me');
      });
      it('[me] emits a warning', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('me');
      });
    });

    describe('ValueError in second locale:', function() {
      it('[mv]', function() {
        var entity = ctx.getEntitySync('mv');
        entity.value.should.equal('MV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
      it('[mv] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('mv');
      });
      it('[mv] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('mv');
      });
      it('[mv] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('mv');
      });
      it('[mv] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('mv');
      });
      it('[mv] emits a warning for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('mv');
      });
      it('[mv] re-emits the ValueError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source === 'MV {{ boo }} de') {
            done();
          }
        });
        ctx.getSync('mv');
      });
    });

    describe('IndexError in second locale:', function() {
      it('[mi]', function() {
        var entity = ctx.getEntitySync('mi');
        entity.value.should.equal('mi');
        entity.should.have.property('locale', null);
      });
      it('[mi] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('mi');
      });
      it('[mi] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('mi');
      });
      it('[mi] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('mi');
      });
      it('[mi] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('mi');
      });
      it('[mi] emits a warning for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('mi');
      });
      it('[mi] re-emits the IndexError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) {
            done();
          }
        });
        ctx.getSync('mi');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[mm]', function() {
        var entity = ctx.getEntitySync('mm');
        entity.value.should.equal('mm');
        entity.should.have.property('locale', null);
      });
      it('[mm] emits 1 error', function(done) {
        var count = 0;
        ctx.addEventListener('error', function() {
          count++;
          if (count >= 1) {
            done();
          }
        });
        ctx.getSync('mm');
      });
      it('[mm] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError)) {
            done();
          }
        });
        ctx.getSync('mm');
      });
      it('[mm] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function() {
          count++;
          if (count >= 2) {
            done();
          }
        });
        ctx.getSync('mm');
      });
      it('[mm] emits a warning for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'pl') {
            done();
          }
        });
        ctx.getSync('mm');
      });
      it('[mm] emits a warning for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale === 'de') {
            done();
          }
        });
        ctx.getSync('mm');
      });
    });
  });
});

describe('Two fallback locales', function() {
  'use strict';
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.lol';
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl', 'de', 'en-US');
  });

  describe('ValueError in first locale', function() {
    describe('ValueError in second locale', function() {
      it('[vve]', function() {
        var entity = ctx.getEntitySync('vve');
        entity.value.should.equal('VVE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[vvv]', function() {
        var entity = ctx.getEntitySync('vvv');
        entity.value.should.equal('VVV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vvi]', function() {
        var entity = ctx.getEntitySync('vvi');
        entity.value.should.equal('VVI {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vvm]', function() {
        var entity = ctx.getEntitySync('vvm');
        entity.value.should.equal('VVM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
    });
    describe('IndexError in second locale', function() {
      it('[vie]', function() {
        var entity = ctx.getEntitySync('vie');
        entity.value.should.equal('VIE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[viv]', function() {
        var entity = ctx.getEntitySync('viv');
        entity.value.should.equal('VIV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vii]', function() {
        var entity = ctx.getEntitySync('vii');
        entity.value.should.equal('VII {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vim]', function() {
        var entity = ctx.getEntitySync('vim');
        entity.value.should.equal('VIM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
    });
    describe('Entity missing in second locale', function() {
      it('[vme]', function() {
        var entity = ctx.getEntitySync('vme');
        entity.value.should.equal('VME en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[vmv]', function() {
        var entity = ctx.getEntitySync('vmv');
        entity.value.should.equal('VMV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vmi]', function() {
        var entity = ctx.getEntitySync('vmi');
        entity.value.should.equal('VMI {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vmm]', function() {
        var entity = ctx.getEntitySync('vmm');
        entity.value.should.equal('VMM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('ValueError in second locale', function() {
      it('[ive]', function() {
        var entity = ctx.getEntitySync('ive');
        entity.value.should.equal('IVE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[ivv]', function() {
        var entity = ctx.getEntitySync('ivv');
        entity.value.should.equal('IVV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[ivi]', function() {
        var entity = ctx.getEntitySync('ivi');
        entity.value.should.equal('IVI {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[ivm]', function() {
        var entity = ctx.getEntitySync('ivm');
        entity.value.should.equal('IVM {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
    });
    describe('IndexError in second locale', function() {
      it('[iie]', function() {
        var entity = ctx.getEntitySync('iie');
        entity.value.should.equal('IIE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[iiv]', function() {
        var entity = ctx.getEntitySync('iiv');
        entity.value.should.equal('IIV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[iii]', function() {
        var entity = ctx.getEntitySync('iii');
        entity.value.should.equal('iii');
        entity.should.have.property('locale', null);
      });

      it('[iim]', function() {
        var entity = ctx.getEntitySync('iim');
        entity.value.should.equal('iim');
        entity.should.have.property('locale', null);
      });
    });
    describe('Entity missing in second locale', function() {
      it('[ime]', function() {
        var entity = ctx.getEntitySync('ime');
        entity.value.should.equal('IME en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[imv]', function() {
        var entity = ctx.getEntitySync('imv');
        entity.value.should.equal('IMV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[imi]', function() {
        var entity = ctx.getEntitySync('imi');
        entity.value.should.equal('imi');
        entity.should.have.property('locale', null);
      });

      it('[imm]', function() {
        var entity = ctx.getEntitySync('imm');
        entity.value.should.equal('imm');
        entity.should.have.property('locale', null);
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('ValueError in second locale', function() {
      it('[mve]', function() {
        var entity = ctx.getEntitySync('mve');
        entity.value.should.equal('MVE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mvv]', function() {
        var entity = ctx.getEntitySync('mvv');
        entity.value.should.equal('MVV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[mvi]', function() {
        var entity = ctx.getEntitySync('mvi');
        entity.value.should.equal('MVI {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[mvm]', function() {
        var entity = ctx.getEntitySync('mvm');
        entity.value.should.equal('MVM {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
    });
    describe('IndexError in second locale', function() {
      it('[mie]', function() {
        var entity = ctx.getEntitySync('mie');
        entity.value.should.equal('MIE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[miv]', function() {
        var entity = ctx.getEntitySync('miv');
        entity.value.should.equal('MIV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mii]', function() {
        var entity = ctx.getEntitySync('mii');
        entity.value.should.equal('mii');
        entity.should.have.property('locale', null);
      });

      it('[mim]', function() {
        var entity = ctx.getEntitySync('mim');
        entity.value.should.equal('mim');
        entity.should.have.property('locale', null);
      });
    });
    describe('Entity missing in second locale', function() {
      it('[mme]', function() {
        var entity = ctx.getEntitySync('mme');
        entity.value.should.equal('MME en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mmv]', function() {
        var entity = ctx.getEntitySync('mmv');
        entity.value.should.equal('MMV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mmi]', function() {
        var entity = ctx.getEntitySync('mmi');
        entity.value.should.equal('mmi');
        entity.should.have.property('locale', null);
      });

      it('[mmm]', function() {
        var entity = ctx.getEntitySync('mmm');
        entity.value.should.equal('mmm');
        entity.should.have.property('locale', null);
      });
    });
  });
});
