var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

function whenReady(ctx, callback) {
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}


describe('No locale fallback', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.properties';
    });
    ctx.registerLocales('pl');
    ctx.requestLocales('pl');
  });

  it('[e] (translation exists)', function() {
    var entity = ctx.getEntity('e');
    entity.value.should.equal('E pl');
    entity.should.have.property('locale', 'pl');
  });

  it('[v] (ValueError)', function() {
    var entity = ctx.getEntity('v');
    entity.value.should.equal('V {{ boo }} pl');
    entity.should.have.property('locale', 'pl');
  });
  it('[v] emits 2 errors', function(done) {
    var count = 0;
    ctx.addEventListener('error', function(e) {
      count++;
      if (count >= 2) 
        done();
    });
    ctx.get('v');
  });
  it('[v] emits a TranslationError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.TranslationError && e.locale == 'pl') done();
    });
    ctx.get('v');
  });
  it('[v] emits a RuntimeError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
        done();
    });
    ctx.get('v');
  });
  it('[v] emits 1 warning', function(done) {
    var count = 0;
    ctx.addEventListener('warning', function(e) {
      count++;
      if (count >= 1) 
        done();
    });
    ctx.get('v');
  });
  it('[v] re-emits the ValueError', function(done) {
    ctx.addEventListener('warning', function(e) {
      if (e instanceof Compiler.ValueError) done();
    });
    ctx.get('v');
  });

  it('[i] (IndexError)', function() {
    var entity = ctx.getEntity('i');
    entity.value.should.equal('i');
    entity.should.have.property('locale', null);
  });
  it('[i] emits 2 errors', function(done) {
    var count = 0;
    ctx.addEventListener('error', function(e) {
      count++;
      if (count >= 2) 
        done();
    });
    ctx.get('i');
  });
  it('[i] emits a TranslationError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.TranslationError && e.locale == 'pl') done();
    });
    ctx.get('v');
  });
  it('[i] emits a RuntimeError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
        done();
    });
    ctx.get('v');
  });
  it('[i] emits 1 warning', function(done) {
    var count = 0;
    ctx.addEventListener('warning', function(e) {
      count++;
      if (count >= 1) 
        done();
    });
    ctx.get('i');
  });
  it('[i] re-emits the IndexError', function(done) {
    ctx.addEventListener('warning', function(e) {
      if (e instanceof Compiler.IndexError) done();
    });
    ctx.get('i');
  });

  it('[m] (translation missing)', function() {
    var entity = ctx.getEntity('m');
    entity.value.should.equal('m');
    entity.should.have.property('locale', null);
  });
  it('[m] emits 1 error', function(done) {
    var count = 0;
    ctx.addEventListener('error', function(e) {
      count++;
      if (count >= 1) 
        done();
    });
    ctx.get('m');
  });
  it('[m] emits a RuntimeError', function(done) {
    ctx.addEventListener('error', function(e) {
      if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
        done();
    });
    ctx.get('m');
  });
  it('[m] emits 1 warning', function(done) {
    var count = 0;
    ctx.addEventListener('warning', function(e) {
      count++;
      if (count >= 1) 
        done();
    });
    ctx.get('m');
  });
  it('[m] emits a warning', function(done) {
    ctx.addEventListener('warning', function(e) {
      if (e instanceof Context.TranslationError && e.locale == 'pl') done();
    });
    ctx.get('m');
  });
});

describe('One fallback locale', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.properties';
    });
    ctx.registerLocales('de', ['de', 'pl']);
    ctx.requestLocales('pl', 'de');
  });

  describe('Translation in the first locale exists and is OK', function() {
    it('[e]', function() {
      var entity = ctx.getEntity('e');
      entity.value.should.equal('E pl');
      entity.should.have.property('locale', 'pl');
    });
  });

  describe('ValueError in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[ve]', function() {
        var entity = ctx.getEntity('ve');
        entity.value.should.equal('VE de');
        entity.should.have.property('locale', 'de');
      });
      it('[ve] emits 1 error', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 1) 
            done();
        });
        ctx.get('ve');
      });
      it('[ve] emits a TranslationError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('ve');
      });
      it('[ve] emits 1 warning', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 1) 
            done();
        });
        ctx.get('ve');
      });
      it('[ve] re-emits the ValueError', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'VE {{ boo }} pl') 
            done();
        });
        ctx.get('ve');
      });
    });

    describe('ValueError in second locale:', function() {
      it('[vv]', function() {
        var entity = ctx.getEntity('vv');
        entity.value.should.equal('VV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
      it('[vv] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 3) 
            done();
        });
        ctx.get('vv');
      });
      it('[vv] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('vv');
      });
      it('[vv] emits a TranslationError for the first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('vv');
      });
      it('[vv] emits a TranslationError for the second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('vv');
      });
      it('[vv] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('vv');
      });
      it('[vv] re-emits the ValueError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'VV {{ boo }} pl') 
            done();
        });
        ctx.get('vv');
      });
      it('[vv] re-emits the ValueError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'VV {{ boo }} de') 
            done();
        });
        ctx.get('vv');
      });
    });

    describe('IndexError in second locale:', function() {
      it('[vi]', function() {
        var entity = ctx.getEntity('vi');
        entity.value.should.equal('VI {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
      it('[vi] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 3) 
            done();
        });
        ctx.get('vi');
      });
      it('[vi] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('vi');
      });
      it('[vi] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('vi');
      });
      it('[vi] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('vi');
      });
      it('[vi] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('vi');
      });
      it('[vi] re-emits the ValueError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'VI {{ boo }} pl') 
            done();
        });
        ctx.get('vi');
      });
      it('[vi] re-emits the IndexError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) 
            done();
        });
        ctx.get('vi');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[vm]', function() {
        var entity = ctx.getEntity('vm');
        //entity.value.should.equal('VM {{ boo }} pl');
        //entity.should.have.property('locale', 'pl');
      });
      it('[vm] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('vm');
      });
      it('[vm] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('vm');
      });
      it('[vm] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('vm');
      });
      it('[vm] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('vm');
      });
      it('[vm] emits a warning for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('vm');
      });
      it('[vm] re-emits the ValueError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'VM {{ boo }} pl') 
            done();
        });
        ctx.get('vm');
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('Entity exists in second locale', function() {
      it('[ie]', function() {
        var entity = ctx.getEntity('ie');
        entity.value.should.equal('IE de');
        entity.should.have.property('locale', 'de');
      });
      it('[ie] emits 1 error', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 1) 
            done();
        });
        ctx.get('ie');
      });
      it('[ie] emits a TranslationError for the first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('ie');
      });
      it('[ie] emits 1 warning', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 1) 
            done();
        });
        ctx.get('ie');
      });
      it('[ie] re-emits the IndexError', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) 
            done();
        });
        ctx.get('ie');
      });
    });

    describe('ValueError in second locale', function() {
      it('[iv]', function() {
        var entity = ctx.getEntity('iv');
        entity.value.should.equal('IV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
      it('[iv] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 3) 
            done();
        });
        ctx.get('iv');
      });
      it('[iv] emits RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('iv');
      });
      it('[iv] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('iv');
      });
      it('[iv] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('iv');
      });
      it('[iv] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('iv');
      });
      it('[iv] re-emits the IndexError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) 
            done();
        });
        ctx.get('iv');
      });
      it('[iv] re-emits the ValueError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'IV {{ boo }} de') 
            done();
        });
        ctx.get('iv');
      });
    });

    describe('IndexError in second locale', function() {
      it('[ii]', function() {
        var entity = ctx.getEntity('ii');
        entity.value.should.equal('ii');
        entity.should.have.property('locale', null);
      });
      it('[ii] emits 3 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 3) 
            done();
        });
        ctx.get('ii');
      });
      it('[ii] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('ii');
      });
      it('[ii] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('ii');
      });
      it('[ii] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('ii');
      });
      it('[ii] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('ii');
      });
      it('[ii] re-emits the IndexErrors for both locales', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (e instanceof Compiler.IndexError && count >= 2) 
            done();
        });
        ctx.get('ii');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[im]', function() {
        var entity = ctx.getEntity('im');
        entity.value.should.equal('im');
        entity.should.have.property('locale', null);
      });
      it('[im] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('im');
      });
      it('[im] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('im');
      });
      it('[im] emits a TranslationError for first locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('im');
      });
      it('[im] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('im');
      });
      it('[im] emits a warning for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('im');
      });
      it('[im] re-emits the IndexError for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) 
            done();
        });
        ctx.get('im');
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[me]', function() {
        var entity = ctx.getEntity('me');
        entity.value.should.equal('ME de');
        entity.should.have.property('locale', 'de');
      });
      it('[me] emits 1 warning', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 1) 
            done();
        });
        ctx.get('me');
      });
      it('[me] emits a warning', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('me');
      });
    });

    describe('ValueError in second locale:', function() {
      it('[mv]', function() {
        var entity = ctx.getEntity('mv');
        entity.value.should.equal('MV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
      it('[mv] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('mv');
      });
      it('[mv] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('mv');
      });
      it('[mv] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('mv');
      });
      it('[mv] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('mv');
      });
      it('[mv] emits a warning for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('mv');
      });
      it('[mv] re-emits the ValueError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.ValueError && e.source == 'MV {{ boo }} de') 
            done();
        });
        ctx.get('mv');
      });
    });

    describe('IndexError in second locale:', function() {
      it('[mi]', function() {
        var entity = ctx.getEntity('mi');
        entity.value.should.equal('mi');
        entity.should.have.property('locale', null);
      });
      it('[mi] emits 2 errors', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('mi');
      });
      it('[mi] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('mi');
      });
      it('[mi] emits a TranslationError for second locale', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('mi');
      });
      it('[mi] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('mi');
      });
      it('[mi] emits a warning for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('mi');
      });
      it('[mi] re-emits the IndexError for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Compiler.IndexError) 
            done();
        });
        ctx.get('mi');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[mm]', function() {
        var entity = ctx.getEntity('mm');
        entity.value.should.equal('mm');
        entity.should.have.property('locale', null);
      });
      it('[mm] emits 1 error', function(done) {
        var count = 0;
        ctx.addEventListener('error', function(e) {
          count++;
          if (count >= 1) 
            done();
        });
        ctx.get('mm');
      });
      it('[mm] emits a RuntimeError', function(done) {
        ctx.addEventListener('error', function(e) {
          if (e instanceof Context.RuntimeError && !(e instanceof Context.TranslationError))
            done();
        });
        ctx.get('mm');
      });
      it('[mm] emits 2 warnings', function(done) {
        var count = 0;
        ctx.addEventListener('warning', function(e) {
          count++;
          if (count >= 2) 
            done();
        });
        ctx.get('mm');
      });
      it('[mm] emits a warning for first locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'pl') 
            done();
        });
        ctx.get('mm');
      });
      it('[mm] emits a warning for second locale', function(done) {
        ctx.addEventListener('warning', function(e) {
          if (e instanceof Context.TranslationError && e.locale == 'de') 
            done();
        });
        ctx.get('mm');
      });
    });
  });
});
