'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { format, lang, createEntries, MockContext } from './header';

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
        format(ctx, lang, {n: 1}, entries.prompt)[1], i('One File', 'File'));
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
      var value = format(ctx, lang, {n: 1}, entries.prompt)[1];
      assert.strictEqual(value, i('One {{ file }}', '{{ file }}'));
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
        format(ctx, lang, {n: 1}, entries.prompt)[1], i('One File', 'File'));
    });

    it('throws an IndexError if n is not defined', function(){
      assert.throws(function() {
        format(ctx, lang, null, entries.prompt);
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
        format(ctx, lang, {n: 1}, entries.prompt)[1], i('One File', 'File'));
    });

    it('throws an IndexError if n is not defined', function(){
      assert.throws(function() {
        format(ctx, lang, null, entries.prompt);
      }, 'Unknown reference: n');
    });

  });

});

