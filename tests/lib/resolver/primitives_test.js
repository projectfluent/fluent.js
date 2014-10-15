/* global assert:true, it, before, beforeEach, describe, requireApp */
'use strict';

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/resolver/header.js');
} else {
  var assert = require('assert');
  var Resolver = require('./header.js').Resolver;
  var createContext = require('./header.js').createContext;
}

describe('Primitives:', function(){
  var source, ctx;
  beforeEach(function() {
    ctx = createContext(source);
  });

  describe('Simple string value', function(){

    before(function() {
      source = [
        'foo=Foo'
      ].join('\n');
    });

    it('returns the value', function(){
      assert.strictEqual(Resolver.formatValue(ctx.cache.foo, ctx), 'Foo');
    });

  });

  describe('Complex string value', function(){

    before(function() {
      source = [
        'foo=Foo',
        'bar={{ foo }} Bar',
        'baz={{ missing }}',
        'qux={{ malformed }'
      ].join('\n');
    });

    it('returns the value', function(){
      var value = Resolver.formatValue(ctx.cache.bar, ctx);
      assert.strictEqual(value, 'Foo Bar');
    });

    it('returns the raw string if the referenced entity is ' +
       'not found', function(){
      var value = Resolver.formatValue(ctx.cache.baz, ctx);
      assert.strictEqual(value, '{{ missing }}');
    });

  });

  describe('Complex string referencing an entity with null value', function(){

    before(function() {
      source = [
        'foo.attr=Foo',
        'bar={{ foo }} Bar',
      ].join('\n');
    });

    it('returns the null value', function(){
      var entity = Resolver.formatEntity(ctx.cache.foo, ctx);
      assert.strictEqual(entity.value, null);
    });

    it('returns the attribute', function(){
      var entity = Resolver.formatEntity(ctx.cache.foo, ctx);
      assert.strictEqual(entity.attrs.attr, 'Foo');
    });

    it('returns the raw string when the referenced entity has ' +
       'null value', function(){
      var value = Resolver.formatValue(ctx.cache.bar, ctx);
      assert.strictEqual(value, '{{ foo }} Bar');
    });

  });

  describe('Cyclic reference', function(){

    before(function() {
      source = [
        'foo={{ bar }}',
        'bar={{ foo }}'
      ].join('\n');
    });

    it('throws', function(){
      assert.throws(function() {
        Resolver.format(ctx.cache.foo, ctx);
      }, /cyclic/i);
    });

  });

  describe('Cyclic self-reference', function(){

    before(function() {
      source = [
        'foo={{ foo }}'
      ].join('\n');
    });

    it('throws', function(){
      assert.throws(function() {
        Resolver.format(ctx.cache.foo, ctx);
      }, /cyclic/i);
    });

  });

  describe('Cyclic self-reference in a hash', function(){

    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[one]={{ foo }}',
        'foo[two]=Bar',
        'bar={{ foo }}'
      ].join('\n');
    });

    it('throws', function(){
      assert.throws(function() {
        Resolver.format(ctx.cache.foo, ctx, {n: 1});
      }, /cyclic/i);
    });

    it('returns the valid value if requested directly', function(){
      var value = Resolver.formatValue(ctx.cache.bar, ctx, {n: 2});
      assert.strictEqual(value, 'Bar');
    });
  });

});
