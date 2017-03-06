'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Functions', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('missing', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { MISSING("Foo") }
      `);
    });

    test('falls back to the name of the function', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'MISSING()');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown function
    });
  });

  suite('arguments', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', {
        useIsolating: false,
        functions: {
          IDENTITY: args => args[0]
        }
      });
      ctx.addMessages(ftl`
        foo = Foo
            .attr = Attribute
        pass-nothing       = { IDENTITY() }
        pass-string        = { IDENTITY("a") }
        pass-number        = { IDENTITY(1) }
        pass-message       = { IDENTITY(foo) }
        pass-attr          = { IDENTITY(foo.attr) }
        pass-external      = { IDENTITY($ext) }
        pass-function-call = { IDENTITY(IDENTITY(1)) }
      `);
    });

    // XXX Gracefully handle wrong argument types passed into FTL Functions
    // https://bugzil.la/1307124
    it.skip('falls back when arguments don\'t match the arity', function() {
      const msg = ctx.messages.get('pass-nothing');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'IDENTITY()');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof RangeError); // wrong argument type
    });

    test('accepts strings', function() {
      const msg = ctx.messages.get('pass-string');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'a');
      assert.equal(errs.length, 0);
    });

    test('accepts numbers', function() {
      const msg = ctx.messages.get('pass-number');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });

    test('accepts entities', function() {
      const msg = ctx.messages.get('pass-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    // XXX Accept complex types (e.g. attributes) as arguments to FTL Functions
    // https://bugzil.la/1307120
    it.skip('accepts attributes', function() {
      const msg = ctx.messages.get('pass-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Attribute');
      assert.equal(errs.length, 0);
    });

    test('accepts externals', function() {
      const msg = ctx.messages.get('pass-external');
      const val = ctx.format(msg, { ext: "Ext" }, errs);
      assert.equal(val, 'Ext');
      assert.equal(errs.length, 0);
    });

    test('accepts function calls', function() {
      const msg = ctx.messages.get('pass-function-call');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });
  });
});
