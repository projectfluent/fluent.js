var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Compiler errors:', function(){
  var source, ast, env;
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

  describe('A complex string referencing an existing entity', function(){
    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });
    it('works with the default index', function(){
      env.prompt.getString({n: 1}).should.equal("One File");
    });
  });

  describe('A complex string referencing a missing entity', function(){
    before(function() {
      source = [
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });
    it('throws a ValueError', function(){
      (function() {
        env.prompt.getString({n: 1});
      }).should.throw(Compiler.ValueError);
      (function() {
        env.prompt.getString({n: 1});
      }).should.throw(/unknown entry/);
    });
    it('provides the source of the string in the ValueError', function(){
      try {
        env.prompt.getString({n: 1});
      } catch (e) {
        e.should.have.property('source', 'One {{ file }}');
      }
    });
  });

  describe('A ctxdata variable in the index', function(){
    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });
    it('is found', function(){
      env.prompt.getString({n: 1}).should.equal("One File");
    });
    it('throws an IndexError if n is not defined', function(){
      (function() {
        env.prompt.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.prompt.getString();
      }).should.throw(/unknown entry/);
    });
  });

});

