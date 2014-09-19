/* global it, before, beforeEach, assert:true, describe, requireApp */
'use strict';
var compile, assert;

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/compiler/header.js');
} else {
  compile = require('./header.js').compile;
  assert = require('./header.js').assert;
}

describe('Primitives:', function(){
  var source, ctx;
  beforeEach(function() {
    ctx = compile(source);
  });

  describe('Simple string value', function(){

    before(function() {
      source = [
        'foo=Foo'
      ].join('\n');
    });

    it('returns the value', function(){
      assert.strictEqual(ctx.cache.foo.format(ctx), 'Foo');
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
      var value = ctx.cache.bar.format(ctx);
      assert.strictEqual(value, 'Foo Bar');
    });

    it('returns the raw string if the referenced entity is ' +
       'not found', function(){
      var value = ctx.cache.baz.format(ctx);
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
      var entity = ctx.cache.foo.get(ctx);
      assert.strictEqual(entity.value, null);
    });

    it('returns the attribute', function(){
      var entity = ctx.cache.foo.get(ctx);
      assert.strictEqual(entity.attributes.attr, 'Foo');
    });

    it('returns the raw string when the referenced entity has ' +
       'null value', function(){
      var value = ctx.cache.bar.format(ctx);
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
        ctx.cache.foo.format(ctx);
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
        ctx.cache.foo.format(ctx);
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
        ctx.cache.foo.format(ctx, {n: 1});
      }, /cyclic/i);
    });

    it('returns the valid value if requested directly', function(){
      var value = ctx.cache.bar.format(ctx, {n: 2});
      assert.strictEqual(value, 'Bar');
    });
  });

});
