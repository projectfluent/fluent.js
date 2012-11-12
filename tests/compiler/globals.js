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

describe('Globals', function(){
  var filename = 'globals.lol';
  var ast, env;
  var globals = {
      get one() {
        return 1;
      },
  };

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    compiler.setGlobals(globals);
    env = compiler.compile(ast);
  });

  describe('A mock @one global', function(){
    it('returns 1 when called', function(){
      var value = env['one'].toString();
      value.should.equal('1');
    });
    it('can be used in a macro', function(){
      var value = env['whatIsIt'].toString();
      value.should.equal('It\'s one');
    });
  });
});
