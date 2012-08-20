var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Globals', function(){
  var filename = 'globals.json';
  var ast;
  var env = {
    entries: {},
    globals: {
      get one() {
        return 1;
      },
    }
  };

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    env.entries = {};
    Compiler.compile(ast, env.entries, env.globals);
  });

  describe('A mock @one global', function(){
    it('returns 1 when called', function(){
      var value = env.entries['one'].toString();
      value.should.equal('1');
    });
    it('can be used in a macro', function(){
      var value = env.entries['whatIsIt'].toString();
      value.should.equal('It\'s one');
    });
  });
});
