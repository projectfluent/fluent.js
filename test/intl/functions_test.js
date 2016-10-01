'use strict';

import assert from 'assert';

import '../../src/intl/polyfill';
import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

describe('Functions', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('missing', function(){
    before(function() {
      ctx = new MessageContext('en-US');
      ctx.addMessages(ftl`
        foo = { MISSING("Foo") }
      `);
    });

    it('falls back to the name of the function', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'MISSING()');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown function
    });
  });

  describe('arguments', function(){
    before(function() {
      ctx = new MessageContext('en-US', {
        functions: {
          IDENTITY: args => args[0]
        }
      });
      ctx.addMessages(ftl`
        foo = Foo
            [trait] Trait
        pass-nothing       = { IDENTITY() }
        pass-string        = { IDENTITY("a") }
        pass-number        = { IDENTITY(1) }
        pass-entity        = { IDENTITY(foo) }
        pass-member        = { IDENTITY(foo[trait]) }
        pass-external      = { IDENTITY($ext) }
        pass-function-call = { IDENTITY(IDENTITY(1)) }
      `);
    });

    it.skip('falls back when arguments don\'t match the arity', function() {
      const msg = ctx.messages.get('pass-nothing');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'IDENTITY()');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof RangeError); // wrong argument type
    });

    it('accepts strings', function() {
      const msg = ctx.messages.get('pass-string');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'a');
      assert.equal(errs.length, 0);
    });

    it('accepts numbers', function() {
      const msg = ctx.messages.get('pass-number');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });

    it('accepts entities', function() {
      const msg = ctx.messages.get('pass-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    it.skip('accepts traits', function() {
      const msg = ctx.messages.get('pass-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Trait');
      assert.equal(errs.length, 0);
    });

    it('accepts externals', function() {
      const msg = ctx.messages.get('pass-external');
      const val = ctx.format(msg, { ext: "Ext" }, errs);
      assert.equal(val, 'Ext');
      assert.equal(errs.length, 0);
    });

    it('accepts function calls', function() {
      const msg = ctx.messages.get('pass-function-call');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });
  });
});
