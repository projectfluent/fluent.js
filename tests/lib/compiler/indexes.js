var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Index', function(){
  var source, ctxdata, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    ast.body['plural'] = {
      type: 'Macro',
      args: [{
        type: 'Identifier',
        name: 'n'
      }],
      expression: function(n) {
        return (n == 1) ? 'one' : 'other';
      }
    };
    env = compiler.compile(ast);
  });

  describe('Cyclic reference to the same entity', function(){
    before(function() {
      source = [
        'foo={[ plural(foo) ]}',
        'foo[one]=One'
      ].join('\n');
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/must be numbers/);
    });
  });

  describe('Reference from an attribute to the value of the same entity', function(){
    before(function() {
      source = [
        'foo=Foo',
        'foo.attr={[ plural(foo) ]}',
        'foo.attr[one]=One'
      ].join('\n');
    });
    it('throws', function() {
      (function() {
        env.foo.get();
      }).should.throw(/must be numbers/);
    });
  });

});
