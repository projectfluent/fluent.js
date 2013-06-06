var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Basic values:', function(){
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
  });

  describe('Simple string value', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
      ';
    });
    it('returns the value', function(){
      var value = env['foo'].getString();
      value.should.equal("Foo");
    });
    it('is detected to be non-complex (simple)', function(){
      env['foo'].value.should.be.a('string');
    });
  });
  describe('Simple string value', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo {{ bar }}">                                                 \
        <bar "Bar">                                                           \
      ';
    });
    it('returns the value', function(){
      var value = env['foo'].getString();
      value.should.equal("Foo Bar");
    });
    it('is detected to be non-complex (simple)', function(){
      env['foo'].value.should.be.a('function');
    });
  });
});
