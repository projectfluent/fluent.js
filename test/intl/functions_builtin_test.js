'use strict';

import assert from 'assert';

import '../../src/intl/polyfill';
import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

describe('Built-in functions', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('NUMBER', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { NUMBER(1) }
      `);
    });

    it('formats the number', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });
  });

  describe('DATETIME', function(){
    let dtf;

    before(function() {
      dtf = new Intl.DateTimeFormat('en-US');
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { DATETIME($date) }
      `);
    });

    it('formats the date', function() {
      const date = new Date('2016-09-29');
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, { date }, errs);
      // format the date argument to account for the testrunner's timezone
      assert.equal(val, dtf.format(date));
      assert.equal(errs.length, 0);
    });
  });

  describe('LIST', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { LIST("a", "b") }
      `);
    });

    it('formats the list', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'a, b');
      assert.equal(errs.length, 0);
    });
  });

  describe('LEN', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { LEN($arg) }
        bar = { LEN(LIST("a", "b")) }
      `);
    });

    it('returns the length of an array argument', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, { arg: ['a', 'b'] }, errs);
      assert.equal(val, '2');
      assert.equal(errs.length, 0);
    });

    it('returns the length of a constructed LIST', function() {
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '2');
      assert.equal(errs.length, 0);
    });
  });

  describe('TAKE', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { TAKE(2, $arg) }
        bar = { TAKE(2, LIST("a", "b", "c")) }
      `);
    });

    it('returns first elements of an array argument', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, { arg: ['a', 'b', 'c'] }, errs);
      assert.equal(val, 'a, b');
      assert.equal(errs.length, 0);
    });

    it('returns first elements of a constructed LIST', function() {
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'a, b');
      assert.equal(errs.length, 0);
    });
  });

  describe('DROP', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { DROP(2, $arg) }
        bar = { DROP(2, LIST("a", "b", "c")) }
      `);
    });

    it('drops first elements of an array argument', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, { arg: ['a', 'b', 'c'] }, errs);
      assert.equal(val, 'c');
      assert.equal(errs.length, 0);
    });

    it('drops first elements of a constructed LIST', function() {
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'c');
      assert.equal(errs.length, 0);
    });
  });
});
