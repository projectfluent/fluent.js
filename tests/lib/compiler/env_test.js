/* global it, beforeEach, assert:true, describe, requireApp */
'use strict';
var compile, assert;

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/compiler/header.js');
} else {
  compile = require('./header.js').compile;
  assert = require('./header.js').assert;
}

describe('Env object', function(){
  var source, ctx;

  beforeEach(function() {
    source = [
      'foo=Foo',
      'getFoo={{ foo }}',
      'getBar={{ bar }}'
    ].join('\n');
    ctx = compile(source);
  });

  it('works', function() {
    assert.strictEqual(ctx.cache.foo.format(ctx), 'Foo');
    assert.strictEqual(ctx.cache.getFoo.format(ctx), 'Foo');
    assert.strictEqual(ctx.cache.getBar.format(ctx), '{{ bar }}');
  });

  it('cannot be modified by another compilation', function() {
    var source2 = [
      'foo=Foo',
      'bar=Bar'
    ].join('\n');
    compile(source2);

    assert.strictEqual(ctx.cache.foo.format(ctx), 'Foo');
    assert.strictEqual(ctx.cache.getFoo.format(ctx), 'Foo');
    assert.strictEqual(ctx.cache.getBar.format(ctx), '{{ bar }}');
  });

});
