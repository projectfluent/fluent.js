var Context = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/context').Context
  : require('../../../lib/l20n/context').Context;
var Compiler = require('../../../lib/l20n/compiler').Compiler;

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
    entity.should.be.false;
    //entity.value.should.equal('V {{ boo }} pl');
    //entity.should.have.property('locale', 'pl');
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
    entity.should.be.false;
    //entity.value.should.equal('i');
    //entity.should.have.property('locale', null);
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
    entity.should.be.false;
    //entity.value.should.equal('m');
    //entity.should.have.property('locale', null);
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
        entity.should.be.false;
        //entity.value.should.equal('VV {{ boo }} pl');
        //entity.should.have.property('locale', 'pl');
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
        entity.should.be.false;
        //entity.value.should.equal('VI {{ boo }} pl');
        //entity.should.have.property('locale', 'pl');
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
        entity.should.be.false;
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
        entity.should.be.false;
        //entity.value.should.equal('IV {{ boo }} de');
        //entity.should.have.property('locale', 'de');
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
        entity.should.be.false;
        //entity.value.should.equal('ii');
        //entity.should.have.property('locale', null);
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
        entity.should.be.false;
        //entity.value.should.equal('im');
        //entity.should.have.property('locale', null);
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
        entity.should.be.false;
        //entity.value.should.equal('MV {{ boo }} de');
        //entity.should.have.property('locale', 'de');
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
        entity.should.be.false;
        //entity.value.should.equal('mi');
        //entity.should.have.property('locale', null);
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
        entity.should.be.false;
        //entity.value.should.equal('mm');
        //entity.should.have.property('locale', null);
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

describe.skip('Two fallback locales', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    whenReady(ctx, done);
    ctx.linkResource(function(locale) {
      return __dirname + '/fixtures/' + locale + '.properties';
    });
    ctx.registerLocales('en-US', ['de', 'en-US', 'pl']);
    ctx.requestLocales('pl', 'de', 'en-US');
  });

  describe('ValueError in first locale', function() {
    describe('ValueError in second locale', function() {
      it('[vve]', function() {
        var entity = ctx.getEntity('vve');
        entity.value.should.equal('VVE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[vvv]', function() {
        var entity = ctx.getEntity('vvv');
        entity.value.should.equal('VVV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vvi]', function() {
        var entity = ctx.getEntity('vvi');
        entity.value.should.equal('VVI {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vvm]', function() {
        var entity = ctx.getEntity('vvm');
        entity.value.should.equal('VVM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
    });
    describe('IndexError in second locale', function() {
      it('[vie]', function() {
        var entity = ctx.getEntity('vie');
        entity.value.should.equal('VIE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[viv]', function() {
        var entity = ctx.getEntity('viv');
        entity.value.should.equal('VIV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vii]', function() {
        var entity = ctx.getEntity('vii');
        entity.value.should.equal('VII {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vim]', function() {
        var entity = ctx.getEntity('vim');
        entity.value.should.equal('VIM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
    });
    describe('Entity missing in second locale', function() {
      it('[vme]', function() {
        var entity = ctx.getEntity('vme');
        entity.value.should.equal('VME en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[vmv]', function() {
        var entity = ctx.getEntity('vmv');
        entity.value.should.equal('VMV {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vmi]', function() {
        var entity = ctx.getEntity('vmi');
        entity.value.should.equal('VMI {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });

      it('[vmm]', function() {
        var entity = ctx.getEntity('vmm');
        entity.value.should.equal('VMM {{ boo }} pl');
        entity.should.have.property('locale', 'pl');
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('ValueError in second locale', function() {
      it('[ive]', function() {
        var entity = ctx.getEntity('ive');
        entity.value.should.equal('IVE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[ivv]', function() {
        var entity = ctx.getEntity('ivv');
        entity.value.should.equal('IVV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[ivi]', function() {
        var entity = ctx.getEntity('ivi');
        entity.value.should.equal('IVI {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[ivm]', function() {
        var entity = ctx.getEntity('ivm');
        entity.value.should.equal('IVM {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
    });
    describe('IndexError in second locale', function() {
      it('[iie]', function() {
        var entity = ctx.getEntity('iie');
        entity.value.should.equal('IIE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[iiv]', function() {
        var entity = ctx.getEntity('iiv');
        entity.value.should.equal('IIV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[iii]', function() {
        var entity = ctx.getEntity('iii');
        entity.value.should.equal('iii');
        entity.should.have.property('locale', null);
      });

      it('[iim]', function() {
        var entity = ctx.getEntity('iim');
        entity.value.should.equal('iim');
        entity.should.have.property('locale', null);
      });
    });
    describe('Entity missing in second locale', function() {
      it('[ime]', function() {
        var entity = ctx.getEntity('ime');
        entity.value.should.equal('IME en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[imv]', function() {
        var entity = ctx.getEntity('imv');
        entity.value.should.equal('IMV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[imi]', function() {
        var entity = ctx.getEntity('imi');
        entity.value.should.equal('imi');
        entity.should.have.property('locale', null);
      });

      it('[imm]', function() {
        var entity = ctx.getEntity('imm');
        entity.value.should.equal('imm');
        entity.should.have.property('locale', null);
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('ValueError in second locale', function() {
      it('[mve]', function() {
        var entity = ctx.getEntity('mve');
        entity.value.should.equal('MVE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mvv]', function() {
        var entity = ctx.getEntity('mvv');
        entity.value.should.equal('MVV {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[mvi]', function() {
        var entity = ctx.getEntity('mvi');
        entity.value.should.equal('MVI {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });

      it('[mvm]', function() {
        var entity = ctx.getEntity('mvm');
        entity.value.should.equal('MVM {{ boo }} de');
        entity.should.have.property('locale', 'de');
      });
    });
    describe('IndexError in second locale', function() {
      it('[mie]', function() {
        var entity = ctx.getEntity('mie');
        entity.value.should.equal('MIE en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[miv]', function() {
        var entity = ctx.getEntity('miv');
        entity.value.should.equal('MIV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mii]', function() {
        var entity = ctx.getEntity('mii');
        entity.value.should.equal('mii');
        entity.should.have.property('locale', null);
      });

      it('[mim]', function() {
        var entity = ctx.getEntity('mim');
        entity.value.should.equal('mim');
        entity.should.have.property('locale', null);
      });
    });
    describe('Entity missing in second locale', function() {
      it('[mme]', function() {
        var entity = ctx.getEntity('mme');
        entity.value.should.equal('MME en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mmv]', function() {
        var entity = ctx.getEntity('mmv');
        entity.value.should.equal('MMV {{ boo }} en-US');
        entity.should.have.property('locale', 'en-US');
      });

      it('[mmi]', function() {
        var entity = ctx.getEntity('mmi');
        entity.value.should.equal('mmi');
        entity.should.have.property('locale', null);
      });

      it('[mmm]', function() {
        var entity = ctx.getEntity('mmm');
        entity.value.should.equal('mmm');
        entity.should.have.property('locale', null);
      });
    });
  });
});
