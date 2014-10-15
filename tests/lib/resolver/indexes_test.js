/* global assert:true, it, before, beforeEach, describe, requireApp */
'use strict';

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/resolver/header.js');
} else {
  var assert = require('assert');
  var Resolver = require('./header.js').Resolver;
  var createContext = require('./header.js').createContext;
}

describe('Index', function(){
  var source, ctx;

  beforeEach(function() {
    ctx = createContext(source);
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
      var value = Resolver.formatValue(ctx.cache.indexEntity, ctx, {n: 1});
      assert.strictEqual(value, 'One entity');
    });
    it('throws when the index is an uncalled macro', function() {
      assert.throws(function() {
        ctx.cache.indexUncalledMacro.formatValue({n: 1});
      }, 'Macro plural expects 1 argument(s), yet 0 given');
    });
    it('returns undefined when the index is an uncalled macro (toString)',
      function() {
      var value = Resolver.formatValue(
        ctx.cache.indexUncalledMacro, ctx, {n: 1});
      assert.strictEqual(value, undefined);
    });
    it('works when the index is a called macro', function() {
      var value = Resolver.formatValue(
        ctx.cache.indexCalledMacro, ctx, {n: 1});
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

    it('is undefined', function() {
      var value = Resolver.formatValue(ctx.cache.foo);
      assert.strictEqual(value, undefined);
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
      var entity = Resolver.formatEntity(ctx.cache.foo);
      assert.strictEqual(entity.value, 'Foo');
      assert.strictEqual(entity.attrs.attr, undefined);
    });

  });

});
