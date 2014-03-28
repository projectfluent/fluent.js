'use strict';

var Parser = require('../../../lib/l20n/parser').Parser;
var compile = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').compile
  : require('../../../lib/l20n/compiler').compile;

var parser = new Parser();

describe('Env object', function(){
  var source, env;
  beforeEach(function() {
    source = [
      'foo=Foo',
      'getFoo={{ foo }}',
      'getBar={{ bar }}'
    ].join('\n');
    env = compile(parser.parse(source));
  });

  it('works', function() {
    env.foo.should.equal('Foo');
    env.getFoo.toString().should.equal('Foo');
    env.getBar.toString().should.equal('{{ bar }}');
  });
  it('cannot be modified by another compilation', function() {
    var source2 = [
      'foo=Foo',
      'bar=Bar'
    ].join('\n');
    var env2 = compile(parser.parse(source2));

    env.foo.should.equal('Foo');
    env.getFoo.toString().should.equal('Foo');
    env.getBar.toString().should.equal('{{ bar }}');
  });
});
