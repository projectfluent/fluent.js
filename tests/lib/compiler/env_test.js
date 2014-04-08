/* global it, beforeEach, assert:true, describe */
'use strict';

var assert = require('assert');
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
    assert.strictEqual(env.foo.toString(), 'Foo');
    assert.strictEqual(env.getFoo.toString(), 'Foo');
    assert.strictEqual(env.getBar.toString(), '{{ bar }}');
  });
  it('cannot be modified by another compilation', function() {
    var source2 = [
      'foo=Foo',
      'bar=Bar'
    ].join('\n');
    compile(source2);

    assert.strictEqual(env.foo.toString(), 'Foo');
    assert.strictEqual(env.getFoo.toString(), 'Foo');
    assert.strictEqual(env.getBar.toString(), '{{ bar }}');
  });
});
