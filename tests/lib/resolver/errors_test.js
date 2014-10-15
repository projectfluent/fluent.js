/* global assert:true, it, before, beforeEach, describe, requireApp */
'use strict';

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/resolver/header.js');
} else {
  var assert = require('assert');
  var Resolver = require('./header.js').Resolver;
  var createContext = require('./header.js').createContext;
}

describe('Compiler errors:', function(){
  var source, ctx;
  beforeEach(function() {
    ctx = createContext(source);
  });

  describe('A complex string referencing an existing entity', function(){

    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });

    it('works with the default index', function(){
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.prompt, ctx, {n: 1}), 'One File');
    });

  });

  describe('A complex string referencing a missing entity', function(){

    before(function() {
      source = [
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });

    it('returns the raw string', function(){
      var value = Resolver.formatValue(ctx.cache.prompt, ctx, {n: 1});
      assert.strictEqual(value, 'One {{ file }}');
    });

  });

  describe('A args variable in the index, with "other"', function(){

    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });

    it('is found', function(){
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.prompt, ctx, {n: 1}), 'One File');
    });

    it('throws an IndexError if n is not defined', function(){
      var value = Resolver.formatValue(ctx.cache.prompt, ctx);
      assert.strictEqual(value, 'Files');
    });

  });

  describe('A args variable in the index, without "other"', function(){

    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
      ].join('\n');
    });

    it('is found', function(){
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.prompt, ctx, {n: 1}), 'One File');
    });

    it('throws an IndexError if n is not defined', function(){
      var value = Resolver.formatValue(ctx.cache.prompt, ctx);
      assert.strictEqual(value, undefined);
    });

  });

});

