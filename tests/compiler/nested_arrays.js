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

describe('Nested array', function(){
  var filename = 'nested_arrays.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('without an index', function(){
    it('is "Firefox" when passedout an index', function(){
      var value = env['brandName11'].toString();
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = env['brandName11']._resolve({}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = env['brandName11']._resolve({}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = env['brandName11']._resolve({}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = env['brandName11']._resolve({}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = env['brandName11']._resolve({}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = env['brandName11']._resolve({}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName11']._resolve({}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of [1]', function(){
    it('is "Aurora" when passedout an index', function(){
      var value = env['brandName12'].toString();
      value.should.equal('Aurora');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = env['brandName12']._resolve({}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = env['brandName12']._resolve({}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = env['brandName12']._resolve({}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = env['brandName12']._resolve({}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = env['brandName12']._resolve({}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = env['brandName12']._resolve({}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName12']._resolve({}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
  describe('array with an index of [1, 1]', function(){
    it('is "Aurora\'s" when passed no index', function(){
      var value = env['brandName13'].toString();
      value.should.equal('Aurora\'s');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = env['brandName13']._resolve({}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = env['brandName13']._resolve({}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = env['brandName13']._resolve({}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = env['brandName13']._resolve({}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = env['brandName13']._resolve({}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = env['brandName13']._resolve({}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName13']._resolve({}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of [7]', function(){
    it('is "Firefox" when passed no index', function(){
      var value = env['brandName14'].toString();
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = env['brandName14']._resolve({}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = env['brandName14']._resolve({}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = env['brandName14']._resolve({}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = env['brandName14']._resolve({}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = env['brandName14']._resolve({}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = env['brandName14']._resolve({}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = env['brandName14']._resolve({}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
});
