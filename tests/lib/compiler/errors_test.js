/* global it, before, beforeEach, assert:true, describe, requireApp */
'use strict';
var compile, assert;

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/compiler/header.js');
} else {
  compile = require('./header.js').compile;
  assert = require('./header.js').assert;
}

describe('Compiler errors:', function(){
  var source, ctx;
  beforeEach(function() {
    ctx = compile(source);
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
        ctx.cache.prompt.formatValue(ctx, {n: 1}), 'One File');
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
      var value = ctx.cache.prompt.formatValue(ctx, {n: 1});
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
        ctx.cache.prompt.formatValue(ctx, {n: 1}), 'One File');
    });

    it('throws an IndexError if n is not defined', function(){
      var value = ctx.cache.prompt.formatValue(ctx);
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
        ctx.cache.prompt.formatValue(ctx, {n: 1}), 'One File');
    });

    it('throws an IndexError if n is not defined', function(){
      var value = ctx.cache.prompt.formatValue(ctx);
      assert.strictEqual(value, undefined);
    });

  });

});

