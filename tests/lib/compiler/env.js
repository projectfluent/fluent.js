'use strict';

var compile = require('./helper').compile;

describe('Env object', function(){
  var source, env;
  beforeEach(function() {
    source = [
      'foo=Foo',
      'getFoo={{ foo }}',
      'getBar={{ bar }}'
    ].join('\n');
    env = compile(source);
  });

  it('works', function() {
    env.foo.toString().should.equal('Foo');
    env.getFoo.toString().should.equal('Foo');
    env.getBar.toString().should.equal('{{ bar }}');
  });
  it('cannot be modified by another compilation', function() {
    var source2 = [
      'foo=Foo',
      'bar=Bar'
    ].join('\n');
    var env2 = compile(source2);

    env.foo.toString().should.equal('Foo');
    env.getFoo.toString().should.equal('Foo');
    env.getBar.toString().should.equal('{{ bar }}');
  });
});
