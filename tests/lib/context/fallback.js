'use strict';

var should = require('should');

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

describe('One fallback locale', function() {
  var ctx;

  beforeEach(function(done) {
    ctx = new Context();
    ctx.resLinks.push(__dirname + '/fixtures/{{locale}}.properties');
    whenReady(ctx, done);
    ctx.requestLocales('pl');
  });

  describe('Translation in the first locale exists and is OK', function() {
    it('[e]', function() {
      var entity = ctx.getEntity('e');
      entity.should.equal('E pl');
    });
  });

  describe('ValueError in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[ve]', function() {
        var entity = ctx.getEntity('ve');
        entity.should.equal('VE {{ boo }} pl');
      });
    });

    describe('ValueError in second locale:', function() {
      it('[vv]', function() {
        var entity = ctx.getEntity('vv');
        entity.should.equal('VV {{ boo }} pl');
      });
    });

    describe('IndexError in second locale:', function() {
      it('[vi]', function() {
        var entity = ctx.getEntity('vi');
        entity.should.equal('VI {{ boo }} pl');
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[vm]', function() {
        var entity = ctx.getEntity('vm');
        entity.should.equal('VM {{ boo }} pl');
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('Entity exists in second locale', function() {
      it('[ie]', function() {
        var entity = ctx.getEntity('ie');
        should.equal(entity, undefined);
      });
    });

    describe('ValueError in second locale', function() {
      it('[iv]', function() {
        var entity = ctx.getEntity('iv');
        should.equal(entity, undefined);
      });
    });

    describe('IndexError in second locale', function() {
      it('[ii]', function() {
        var entity = ctx.getEntity('ii');
        should.equal(entity, undefined);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[im]', function() {
        var entity = ctx.getEntity('im');
        should.equal(entity, undefined);
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[me]', function() {
        var entity = ctx.getEntity('me');
        entity.should.equal('ME en-US');
      });
    });

    describe('ValueError in second locale:', function() {
      it('[mv]', function() {
        var entity = ctx.getEntity('mv');
        entity.should.equal('MV {{ boo }} en-US');
      });
    });

    describe('IndexError in second locale:', function() {
      it('[mi]', function() {
        var entity = ctx.getEntity('mi');
        should.equal(entity, undefined);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[mm]', function() {
        var entity = ctx.getEntity('mm');
        should.equal(entity, null);
      });
    });
  });
});
