var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../_build/cov/lib/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Macros', function(){
  var filename = 'macros.json';
  var ast;
  var env = {
    entries: {},
    globals: {}
  };

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    env.entries = {};
    Compiler.compile(ast, env.entries);
  });

  describe('Simple macros', function(){
    describe('Double', function(){
      it('returns 6 for 3', function(){
        var value = env.entries['callDouble'].toString();
        value.should.equal('6');
      });
    });
    describe('Zero', function(){
      it('returns 0 for 1', function(){
        var value = env.entries['callZero'].toString();
        value.should.equal('0');
      });
    });
    describe('isFalsy', function(){
      it('returns "falsy" for 0', function(){
        var value = env.entries['callIsFalsy1'].toString();
        value.should.equal('falsy');
      });
      it('returns "falsy" for "" (an empty string)', function(){
        var value = env.entries['callIsFalsy2'].toString();
        value.should.equal('falsy');
      });
      it('returns "falsy" for []', function(){
        var value = env.entries['callIsFalsy3'].toString();
        value.should.equal('falsy');
      });
      it('returns "falsy" for {}', function(){
        var value = env.entries['callIsFalsy4'].toString();
        value.should.equal('falsy');
      });
      it('returns "truthy" for 1', function(){
        var value = env.entries['callIsFalsy5'].toString();
        value.should.equal('truthy');
      });
      it('returns "truthy" for "text"', function(){
        var value = env.entries['callIsFalsy6'].toString();
        value.should.equal('truthy');
      });
      it('returns "truthy" for ["text"]', function(){
        var value = env.entries['callIsFalsy7'].toString();
        value.should.equal('truthy');
      });
      it('returns "truthy" for {one: "text"}', function(){
        var value = env.entries['callIsFalsy8'].toString();
        value.should.equal('truthy');
      });
    });
    describe('isTruthy', function(){
      it('returns "falsy" for 0', function(){
        var value = env.entries['callIsTruthy'].toString();
        value.should.equal('falsy');
      });
    });
  });

  describe('Funky macros', function(){
    describe('nth Fibonnaci number', function(){
      it('returns 6765 for [20]', function(){
        var value = env.entries['callFib'].toString();
        value.should.equal('6765');
      });
    });
    describe('factorial', function(){
      it('returns 120 for [5]', function(){
        var value = env.entries['callFac'].toString();
        value.should.equal('120');
      });
    });
    describe('plural', function(){
      it('returns "many" for 0', function(){
        var value = env.entries['callPlural0'].toString();
        value.should.equal('many');
      });
      it('returns "one" for 1', function(){
        var value = env.entries['callPlural1'].toString();
        value.should.equal('one');
      });
      it('returns "few" for 2', function(){
        var value = env.entries['callPlural2'].toString();
        value.should.equal('few');
      });
      it('returns "many" for 5', function(){
        var value = env.entries['callPlural5'].toString();
        value.should.equal('many');
      });
      it('returns "many" for 11', function(){
        var value = env.entries['callPlural11'].toString();
        value.should.equal('many');
      });
      it('returns "few" for 22', function(){
        var value = env.entries['callPlural22'].toString();
        value.should.equal('few');
      });
      it('returns "many" for 101', function(){
        var value = env.entries['callPlural101'].toString();
        value.should.equal('many');
      });
      it('returns "few" for 102', function(){
        var value = env.entries['callPlural102'].toString();
        value.should.equal('few');
      });
      it('returns "many" for 111', function(){
        var value = env.entries['callPlural111'].toString();
        value.should.equal('many');
      });
      it('returns "many" for 121', function(){
        var value = env.entries['callPlural121'].toString();
        value.should.equal('many');
      });
      it('returns "few" for 122', function(){
        var value = env.entries['callPlural122'].toString();
        value.should.equal('few');
      });
    });
  });

  describe('Nested macros', function(){
    describe('Logical OR expression', function(){
      it('returns the second operand if the first one is false', function(){
        var value = env.entries['callZeroOrFac'].toString();
        value.should.equal('120');
      });
    });
    describe('Quad', function(){
      it('returns 28 for 7', function(){
        var value = env.entries['callQuad'].toString();
        value.should.equal('28');
      });
    });
  });

  describe('Passing references to entires', function(){
    describe('Calling a macro indirectly', function(){
      it('returns 120 for fac and 5', function(){
        var value = env.entries['callCall'].toString();
        value.should.equal('120');
      });
      it('throws a TypeError for "fac" and 5', function(){
        (function () {
          var value = env.entries['callCallString'].toString();
        }).should.throw(TypeError);
      });
    });
    describe('Passing an entity to a macro', function(){
      it('returns "Firefox"', function(){
        var value = env.entries['callGet'].toString();
        value.should.equal('Firefox');
      });
      it('returns "Firefox" with a property accessor in the complexString', function(){
        var value = env.entries['callGet1'].toString();
        value.should.equal('Firefox');
      });
      it('returns "Firefox\'s" with a property accessor in the complexString', function(){
        var value = env.entries['callGet2'].toString();
        value.should.equal('Firefox\'s');
      });
      it('returns "Firefox\'s" with a property accessor in the macro expression', function(){
        var value = env.entries['callGetGenitive'].toString();
        value.should.equal('Firefox\'s');
      });
    });
    describe('Calling a macro which returns an entity', function(){
      it('should resolve to "Firefox"', function(){
        var value = env.entries['callGetBrandName'].toString();
        value.should.equal('Firefox');
      });
    });
    describe('Calling a macro which returns an entity\'s hashItem which is a string', function(){
      it('should resolve to "Firefox\'s" when called with "genitive"', function(){
        var value = env.entries['callGetBrandNameCase'].toString();
        value.should.equal('Firefox\'s');
      });
    });
    describe('', function(){
      it('', function(){
        var value = env.entries['callGetBrandNameLength1'].toString();
        value.should.equal('Mozilla Firefox');
      });
      it('', function(){
        var value = env.entries['callGetBrandNameLength2'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
      it('', function(){
        var value = env.entries['callGetBrandNameLengthGenitive'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
    });
    describe('', function(){
      it('', function(){
        var value = env.entries['callGetBrandNameThisLength1'].toString();
        value.should.equal('Mozilla Firefox');
      });
      it('', function(){
        var value = env.entries['callGetBrandNameThisLength2'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
      it('', function(){
        var value = env.entries['callGetBrandNameThisGenitive'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
      it('', function(){
        var value = env.entries['callGetBrandNameThis1'].toString();
        value.should.equal('Mozilla Firefox');
      });
      it('', function(){
        var value = env.entries['callGetBrandNameThis2'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
    });
  });
});
