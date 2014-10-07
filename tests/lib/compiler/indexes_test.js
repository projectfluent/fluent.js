/* global it, before, beforeEach, assert:true, describe, requireApp */
'use strict';
var compile, assert;

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/compiler/header.js');
} else {
  compile = require('./header.js').compile;
  assert = require('./header.js').assert;
}

describe('Index', function(){
  var source, ctx;

  beforeEach(function() {
    ctx = compile(source);
  });

  describe('Different values of index', function(){

    before(function() {
      source = [
        'foo=one',
        'indexEntity={[ foo ]}',
        'indexEntity[one]=One entity',
        'indexUncalledMacro={[ plural ]}',
        'indexUncalledMacro[one]=One uncalled macro',
        'indexCalledMacro={[ plural(n) ]}',
        'indexCalledMacro[one]=One called macro',
      ].join('\n');
    });

    it('works when the index is a regular entity', function() {
      var value = ctx.cache.indexEntity.formatValue(ctx, {n: 1});
      assert.strictEqual(value, 'One entity');
    });
    it('throws when the index is an uncalled macro', function() {
      assert.throws(function() {
        ctx.cache.indexUncalledMacro.formatValue({n: 1});
      }, 'Macro plural expects 1 argument(s), yet 0 given');
    });
    it('works when the index is a called macro', function() {
      var value = ctx.cache.indexCalledMacro.formatValue(ctx, {n: 1});
      assert.strictEqual(value, 'One called macro');
    });

  });

  describe('Cyclic reference to the same entity', function(){

    before(function() {
      source = [
        'foo={[ plural(foo) ]}',
        'foo[one]=One'
      ].join('\n');
    });

    it('throws', function() {
      assert.throws(function() {
        ctx.cache.foo.formatValue(ctx);
      }, /cyclic/i);
    });

  });

  describe('Reference from an attribute to the value of the same ' +
           'entity', function(){

    before(function() {
      source = [
        'foo=Foo',
        'foo.attr={[ plural(foo) ]}',
        'foo.attr[one]=One'
      ].join('\n');
    });

    it('value of the attribute is undefined', function() {
      var entity = ctx.cache.foo.formatEntity(ctx);
      assert.strictEqual(entity.value, 'Foo');
      assert.strictEqual(entity.attributes.attr, undefined);
    });

  });

});
