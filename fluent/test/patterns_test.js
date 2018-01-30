'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from '../src/util';

suite('Patterns', function(){
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('Simple string value', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
      `);
    });

    test('returns the value', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });
  });

  suite('Complex string value', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        -bar = Bar

        ref-message = { foo }
        ref-term = { -bar }

        ref-missing-message = { missing }
        ref-missing-term = { -missing }

        ref-malformed = { malformed
      `);
    });

    test('resolves the reference to a message', function(){
      const msg = ctx.getMessage('ref-message');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    test('resolves the reference to a term', function(){
      const msg = ctx.getMessage('ref-term');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, 'Bar');
      assert.equal(errs.length, 0);
    });

    test('returns the id if a message reference is missing', function(){
      const msg = ctx.getMessage('ref-missing-message');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, 'missing');
      assert.ok(errs[0] instanceof ReferenceError); // unknown message
    });

    test('returns the id if a term reference is missing', function(){
      const msg = ctx.getMessage('ref-missing-term');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, '-missing');
      assert.ok(errs[0] instanceof ReferenceError); // unknown message
    });
  });

  suite('Complex string referencing a message with null value', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo
            .attr = Foo Attr
        bar = { foo } Bar
      `);
    });

    test('returns the null value', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, null);
      assert.equal(errs.length, 0);
    });

    test('formats the attribute', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg.attrs.attr, args, errs);
      assert.strictEqual(val, 'Foo Attr');
      assert.equal(errs.length, 0);
    });

    test('formats ??? when the referenced message has no value and no default',
       function(){
      const msg = ctx.getMessage('bar');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, '??? Bar');
      assert.ok(errs[0] instanceof RangeError); // no default
    });
  });

  suite('Cyclic reference', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { bar }
        bar = { foo }
      `);
    });

    test('returns ???', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, '???');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  suite('Cyclic self-reference', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { foo }
      `);
    });

    test('returns the raw string', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, '???');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  suite('Cyclic self-reference in a member', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo =
            { $sel ->
               *[a] { foo }
                [b] Bar
            }
        bar = { foo }
      `);
    });

    test('returns ???', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, {sel: 'a'}, errs);
      assert.strictEqual(val, '???');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });

    test('returns the other member if requested', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, {sel: 'b'}, errs);
      assert.strictEqual(val, 'Bar');
      assert.equal(errs.length, 0);
    });
  });

  suite('Cyclic reference in a selector', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        -foo =
            { -bar.attr ->
               *[a] Foo
            }
        -bar = Bar
            .attr = { -foo }

        foo = { -foo }
      `);
    });

    test('returns the default variant', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  suite('Cyclic self-reference in a selector', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        -foo =
            { -bar.attr ->
               *[a] Foo
            }
            .attr = a

        -bar =
            { -foo.attr ->
              *[a] Bar
            }
            .attr = { -foo }

        foo = { -foo }
        bar = { -bar }
      `);
    });

    test('returns the default variant', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });

    test('can reference an attribute', function(){
      const msg = ctx.getMessage('bar');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, 'Bar');
      assert.equal(errs.length, 0);
    });
  });
});
