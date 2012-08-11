var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Funky macros', function(){
  var filename = 'macros.json';
  var ast;
  var obj;

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('nth Fibonnaci number', function(){
    it('returns 6765 for [20]', function(){
      var value = obj['fib']([20], obj);
      value.should.equal(6765);
    });
  });
  describe('factorial', function(){
    it('returns 120 for [5]', function(){
      var value = obj['fac']([5], obj);
      value.should.equal(120);
    });
  });
});
