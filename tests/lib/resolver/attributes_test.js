'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { format, lang, createEntries, MockContext } from './header';

describe('Attributes', function(){
  var entries, ctx;

  describe('with string values', function(){

    before(function() {
      entries = createEntries([
        'foo=Foo',
        'foo.attr=An attribute',
        'foo.attrComplex=An attribute referencing {{ bar }}',
        'bar=Bar'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the value', function(){
      var formatted = format(ctx, lang, null, entries.foo.attrs.attr);
      assert.strictEqual(formatted[1], 'An attribute');
    });

    it('returns the value with a placeable', function(){
      var formatted = format(
        ctx, lang, null, entries.foo.attrs.attrComplex);
      assert.strictEqual(
        formatted[1], i('An attribute referencing Bar', 'Bar'));
    });

  });

  describe('with hash values', function(){

    before(function() {
      entries = createEntries([
        'update=Update',
        'update.title={[ plural(n) ]}',
        'update.title[one]=One update available'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the value of the entity', function(){
      var formatted = format(ctx, lang, null, entries.update);
      assert.strictEqual(formatted[1], 'Update');
    });

    it('returns the value of the attribute\'s member', function(){
      var formatted = format(ctx, lang, {n: 1}, entries.update.attrs.title);
      assert.strictEqual(formatted[1], 'One update available');
    });

  });


  describe('with hash values, on entities with hash values ', function(){

    before(function() {
      entries = createEntries([
        'update={[ plural(n) ]}',
        'update[one]=One update',
        'update[other]={{ n }} updates',
        'update.title={[ plural(k) ]}',
        'update.title[one]=One update title',
        'update.title[other]={{ k }} updates title'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the value of the entity', function(){
      var formatted = format(ctx, lang, {n: 1, k: 2}, entries.update);
      assert.strictEqual(formatted[1], 'One update');
    });

    it('returns the value of the attribute', function(){
      var formatted = format(
        ctx, lang, {n: 1, k: 2}, entries.update.attrs.title);
      assert.strictEqual(formatted[1], i('2 updates title', '2'));
    });

  });

  describe('with relative self-references', function(){

    before(function() {
      entries = createEntries([
        'brandName=Firefox',
        'brandName.title=Mozilla {{ brandName }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the value of the entity', function(){
      var value = format(ctx, lang, null, entries.brandName)[1];
      assert.strictEqual(value, 'Firefox');
    });

    it('returns the value of the attribute', function(){
      var attr = format(ctx, lang, null, entries.brandName.attrs.title)[1];
      assert.strictEqual(attr, i('Mozilla Firefox', 'Firefox'));
    });

  });

  describe('with cyclic self-references', function(){

    before(function() {
      entries = createEntries([
        'brandName=Firefox',
        'brandName.title=Mozilla {{ brandName.title }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string of the attribute', function(){
      var attr = format(ctx, lang, null, entries.brandName.attrs.title)[1];
      assert.strictEqual(
        attr, i('Mozilla {{ brandName.title }}', '{{ brandName.title }}'));
    });

  });

});
