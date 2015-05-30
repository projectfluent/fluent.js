/* global assert:true, it, before, describe, requireApp */
'use strict';

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/resolver/header.js');
} else {
  var assert = require('assert');
  var Resolver = require('./header.js').Resolver;
  var createEntries = require('./header.js').createEntries;
  var MockContext = require('./header').MockContext;
}

describe('Compiler errors:', function(){
  var entries, ctx;

  describe('A complex string referencing an existing entity', function(){

    before(function() {
      entries = createEntries([
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('works with the default index', function(){
      assert.strictEqual(
        Resolver.format(ctx, {n: 1}, entries.prompt)[1], 'One File');
    });

  });

  describe('A complex string referencing a missing entity', function(){

    before(function() {
      entries = createEntries([
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = Resolver.format(ctx, {n: 1}, entries.prompt)[1];
      assert.strictEqual(value, 'One {{ file }}');
    });

  });

  describe('A ctxdata variable in the index, with "other"', function(){

    before(function() {
      entries = createEntries([
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('is found', function(){
      assert.strictEqual(
        Resolver.format(ctx, {n: 1}, entries.prompt)[1], 'One File');
    });

    it('throws an IndexError if n is not defined', function(){
      assert.throws(function() {
        Resolver.format(ctx, null, entries.prompt);
      }, 'Unknown reference: n');
    });

  });

  describe('A ctxdata variable in the index, without "other"', function(){

    before(function() {
      entries = createEntries([
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('is found', function(){
      assert.strictEqual(
        Resolver.format(ctx, {n: 1}, entries.prompt)[1], 'One File');
    });

    it('throws an IndexError if n is not defined', function(){
      assert.throws(function() {
        Resolver.format(ctx, null, entries.prompt);
      }, 'Unknown reference: n');
    });

  });

});

