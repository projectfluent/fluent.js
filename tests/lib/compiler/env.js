var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Env object', function(){
  var source, ctxdata, ast, env;
  beforeEach(function() {
    source = [
      'foo=Foo',
      'getFoo={{ foo }}',
      'getBar={{ bar }}'
    ].join('\n');
    ast = parser.parse(source);
    env = compiler.compile(ast);
  });

  it('works', function() {
    env.foo.getString().should.equal('Foo');
    env.getFoo.getString().should.equal('Foo');
    (function() {
      env.getBar.getString();
    }).should.throw(/unknown entry: bar/);
  });
  it('cannot be modified by another compilation', function() {
    source2 = [
      'foo=Foo',
      'bar=Bar'
    ].join('\n');
    ast2 = parser.parse(source2);
    env2 = compiler.compile(ast2);

    env.foo.getString().should.equal('Foo');
    env.getFoo.getString().should.equal('Foo');
    (function() {
      env.getBar.getString();
    }).should.throw(/unknown entry: bar/);
  });

});
