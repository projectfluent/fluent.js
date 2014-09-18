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
  var source, env;
  beforeEach(function() {
    env = compile(source);
  });

  describe('Simple string value', function(){

    before(function() {
      source = [
        'foo=Foo'
      ].join('\n');
    });

    it('returns the value', function(){
      assert.strictEqual(env.foo.format(), 'Foo');
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
      var value = env.bar.format();
      assert.strictEqual(value, 'Foo Bar');
    });

    it('returns the raw string if the referenced entity is ' +
       'not found', function(){
      var value = env.baz.format();
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
      var entity = env.foo.get();
      assert.strictEqual(entity.value, null);
    });

    it('returns the attribute', function(){
      var entity = env.foo.get();
      assert.strictEqual(entity.attributes.attr, 'Foo');
    });

    it('returns the raw string when the referenced entity has ' +
       'null value', function(){
      var value = env.bar.format();
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

    it('returns the raw string', function(){
      var value = env.foo.format();
      assert.strictEqual(value, '{{ foo }}');
    });

  });

  describe('Cyclic self-reference', function(){

    before(function() {
      source = [
        'foo={{ foo }}'
      ].join('\n');
    });

    it('returns the raw string', function(){
      var value = env.foo.format();
      assert.strictEqual(value, '{{ foo }}');
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

    it('returns the raw string', function(){
      var value = env.foo.format({n: 1});
      assert.strictEqual(value, '{{ foo }}');
    });

    it('returns the valid value if requested directly', function(){
      var value = env.bar.format({n: 2});
      assert.strictEqual(value, 'Bar');
    });
  });

});
