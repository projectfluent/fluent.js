var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../_build/cov/lib/compiler.js').Compiler
  : require('../../lib/compiler.js').Compiler;
var Parser = require('../../lib/parser.js').Parser;

var compiler = new Compiler(null, Parser);
var parser = new Parser();

function read(filename) {
  var lol = fs.readFileSync('./tests/fixtures/' + filename).toString();
  return parser.parse(lol);
}

describe('Macros', function(){
  var filename = 'macros.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('Simple macros', function(){
    describe('Double', function(){
      it('returns 6 for 3', function(){
        var value = env['callDouble'].toString();
        value.should.equal('6');
      });
    });
    describe('Zero', function(){
      it('returns 0 for 1', function(){
        var value = env['callZero'].toString();
        value.should.equal('0');
      });
    });
    describe('isFalsy', function(){
      it('returns "falsy" for 0', function(){
        var value = env['callIsFalsy1'].toString();
        value.should.equal('falsy');
      });
      it('returns "falsy" for "" (an empty string)', function(){
        var value = env['callIsFalsy2'].toString();
        value.should.equal('falsy');
      });
      it('returns "falsy" for []', function(){
        var value = env['callIsFalsy3'].toString();
        value.should.equal('falsy');
      });
      it('returns "falsy" for {}', function(){
        var value = env['callIsFalsy4'].toString();
        value.should.equal('falsy');
      });
      it('returns "truthy" for 1', function(){
        var value = env['callIsFalsy5'].toString();
        value.should.equal('truthy');
      });
      it('returns "truthy" for "text"', function(){
        var value = env['callIsFalsy6'].toString();
        value.should.equal('truthy');
      });
      it('returns "truthy" for ["text"]', function(){
        var value = env['callIsFalsy7'].toString();
        value.should.equal('truthy');
      });
      it('returns "truthy" for {one: "text"}', function(){
        var value = env['callIsFalsy8'].toString();
        value.should.equal('truthy');
      });
    });
    describe('isTruthy', function(){
      it('returns "falsy" for 0', function(){
        var value = env['callIsTruthy'].toString();
        value.should.equal('falsy');
      });
    });
  });

  describe('Funky macros', function(){
    describe('nth Fibonnaci number', function(){
      it('returns 6765 for [20]', function(){
        var value = env['callFib'].toString();
        value.should.equal('6765');
      });
    });
    describe('factorial', function(){
      it('returns 120 for [5]', function(){
        var value = env['callFac'].toString();
        value.should.equal('120');
      });
    });
    describe('plural', function(){
      it('returns "many" for 0', function(){
        var value = env['callPlural0'].toString();
        value.should.equal('many');
      });
      it('returns "one" for 1', function(){
        var value = env['callPlural1'].toString();
        value.should.equal('one');
      });
      it('returns "few" for 2', function(){
        var value = env['callPlural2'].toString();
        value.should.equal('few');
      });
      it('returns "many" for 5', function(){
        var value = env['callPlural5'].toString();
        value.should.equal('many');
      });
      it('returns "many" for 11', function(){
        var value = env['callPlural11'].toString();
        value.should.equal('many');
      });
      it('returns "few" for 22', function(){
        var value = env['callPlural22'].toString();
        value.should.equal('few');
      });
      it('returns "many" for 101', function(){
        var value = env['callPlural101'].toString();
        value.should.equal('many');
      });
      it('returns "few" for 102', function(){
        var value = env['callPlural102'].toString();
        value.should.equal('few');
      });
      it('returns "many" for 111', function(){
        var value = env['callPlural111'].toString();
        value.should.equal('many');
      });
      it('returns "many" for 121', function(){
        var value = env['callPlural121'].toString();
        value.should.equal('many');
      });
      it('returns "few" for 122', function(){
        var value = env['callPlural122'].toString();
        value.should.equal('few');
      });
    });
  });

  describe('Nested macros', function(){
    describe('Logical OR expression', function(){
      it('returns the second operand if the first one is false', function(){
        var value = env['callZeroOrFac'].toString();
        value.should.equal('120');
      });
    });
    describe('Quad', function(){
      it('returns 28 for 7', function(){
        var value = env['callQuad'].toString();
        value.should.equal('28');
      });
    });
  });

  describe('Passing references to entires', function(){
    describe('Calling a macro indirectly', function(){
      it('returns 120 for fac and 5', function(){
        var value = env['callCall'].toString();
        value.should.equal('120');
      });
      it('throws a TypeError for "fac" and 5', function(){
        (function () {
          var value = env['callCallString'].toString();
        }).should.throw(TypeError);
      });
    });
    describe('Passing an entity to a macro', function(){
      it('returns "Firefox"', function(){
        var value = env['callGet'].toString();
        value.should.equal('Firefox');
      });
      it('returns "Firefox" with a property accessor in the complexString', function(){
        var value = env['callGet1'].toString();
        value.should.equal('Firefox');
      });
      it('returns "Firefox\'s" with a property accessor in the complexString', function(){
        var value = env['callGet2'].toString();
        value.should.equal('Firefox\'s');
      });
      it('returns "Firefox\'s" with a property accessor in the macro expression', function(){
        var value = env['callGetGenitive'].toString();
        value.should.equal('Firefox\'s');
      });
    });
    describe('Calling a macro which returns an entity', function(){
      it('should resolve to "Firefox"', function(){
        var value = env['callGetBrandName'].toString();
        value.should.equal('Firefox');
      });
    });
    describe('Calling a macro which returns an entity\'s hashItem which is a string', function(){
      it('should resolve to "Firefox\'s" when called with "genitive"', function(){
        var value = env['callGetBrandNameCase'].toString();
        value.should.equal('Firefox\'s');
      });
    });
    describe('', function(){
      it('', function(){
        var value = env['callGetBrandNameLength1'].toString();
        value.should.equal('Mozilla Firefox');
      });
      it('', function(){
        var value = env['callGetBrandNameLength2'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
      it('', function(){
        var value = env['callGetBrandNameLengthGenitive'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
    });
    describe('', function(){
      it('', function(){
        var value = env['callGetBrandNameThisLength1'].toString();
        value.should.equal('Mozilla Firefox');
      });
      it('', function(){
        var value = env['callGetBrandNameThisLength2'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
      it('', function(){
        var value = env['callGetBrandNameThisGenitive'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
      it('', function(){
        var value = env['callGetBrandNameThis1'].toString();
        value.should.equal('Mozilla Firefox');
      });
      it('', function(){
        var value = env['callGetBrandNameThis2'].toString();
        value.should.equal('Mozilla Firefox\'s');
      });
    });
  });
});
