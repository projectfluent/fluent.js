'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { format, lang, createEntries, MockContext } from './header';

describe('Primitives:', function(){
  var entries, ctx;

  describe('Simple string value', function(){

    before(function() {
      entries = createEntries([
        'foo=Foo'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the value', function(){
      assert.strictEqual(format(ctx, lang, null, entries.foo)[1], 'Foo');
    });

  });

  describe('Complex string value', function(){

    before(function() {
      entries = createEntries([
        'foo=Foo',
        'bar={{ foo }} Bar',
        'baz={{ missing }}',
        'qux={{ malformed }'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the value', function(){
      var value = format(ctx, lang, null, entries.bar)[1];
      assert.strictEqual(value, i('Foo Bar', 'Foo'));
    });

    it('returns the raw string if the referenced entity is ' +
       'not found', function(){
      var value = format(ctx, lang, null, entries.baz)[1];
      assert.strictEqual(value, i('{{ missing }}'));
    });

  });

  describe('Complex string referencing an entity with null value', function(){

    before(function() {
      entries = createEntries([
        'foo.attr=Foo',
        'bar={{ foo }} Bar',
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the null value', function(){
      var value = format(ctx, lang, null, entries.foo)[1];
      assert.strictEqual(value, undefined);
    });

    it('returns the attribute', function(){
      var attr = format(ctx, lang, null, entries.foo.attrs.attr)[1];
      assert.strictEqual(attr, 'Foo');
    });

    it('returns the raw string when the referenced entity has ' +
       'null value', function(){
      var value = format(ctx, lang, null, entries.bar)[1];
      assert.strictEqual(value, i('{{ foo }} Bar', '{{ foo }}'));
    });

  });

  describe('Cyclic reference', function(){

    before(function() {
      entries = createEntries([
        'foo={{ bar }}',
        'bar={{ foo }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = format(ctx, lang, null, entries.foo)[1];
      assert.strictEqual(value, i(i('{{ foo }}')));
    });

  });

  describe('Cyclic self-reference', function(){

    before(function() {
      entries = createEntries([
        'foo={{ foo }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = format(ctx, lang, null, entries.foo)[1];
      assert.strictEqual(value, i('{{ foo }}'));
    });

  });

  describe('Cyclic self-reference in a hash', function(){

    before(function() {
      entries = createEntries([
        'foo={[ plural(n) ]}',
        'foo[one]={{ foo }}',
        'foo[two]=Bar',
        'bar={{ foo }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = format(ctx, lang, {n: 1}, entries.foo)[1];
      assert.strictEqual(value, i('{{ foo }}'));
    });

    it('returns the valid value if requested directly', function(){
      var value = format(ctx, lang, {n: 2}, entries.bar)[1];
      assert.strictEqual(value, i('Bar'));
    });
  });

});
