'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';

suite('Patterns', function(){
  let bundle, args, errs;

  setup(function() {
    errs = [];
  });

  suite('Simple string value', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        `);
    });

    test('returns the value', function(){
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.strictEqual(errs.length, 0);
    });
  });

  suite('Complex string value', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
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
      const msg = bundle.getMessage('ref-message');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.strictEqual(errs.length, 0);
    });

    test('resolves the reference to a term', function(){
      const msg = bundle.getMessage('ref-term');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'Bar');
      assert.strictEqual(errs.length, 0);
    });

    test('returns the id if a message reference is missing', function(){
      const msg = bundle.getMessage('ref-missing-message');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, '{missing}');
      assert.ok(errs[0] instanceof ReferenceError); // unknown message
    });

    test('returns the id if a term reference is missing', function(){
      const msg = bundle.getMessage('ref-missing-term');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, '{-missing}');
      assert.ok(errs[0] instanceof ReferenceError); // unknown message
    });
  });

  suite('Complex string referencing a message with null value', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo =
            .attr = Foo Attr
        bar = { foo } Bar
        `);
    });

    test('throws when trying to format a null value', function(){
      const msg = bundle.getMessage('foo');
      assert.throws(
        () => bundle.formatPattern(msg.value, args, errs),
        /Invalid Pattern type/
      );
    });

    test('formats the attribute', function(){
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, 'Foo Attr');
      assert.strictEqual(errs.length, 0);
    });

    test('falls back to id when the referenced message has no value', function(){
      const msg = bundle.getMessage('bar');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, '{foo} Bar');
      assert.ok(errs[0] instanceof ReferenceError); // no value
    });
  });

  suite('Cyclic reference', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { bar }
        bar = { foo }
        `);
    });

    test('returns ???', function(){
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, '{???}');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  suite('Cyclic self-reference', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { foo }
        `);
    });

    test('returns ???', function(){
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, '{???}');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  suite('Cyclic self-reference in a member', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo =
            { $sel ->
               *[a] { foo }
                [b] Bar
            }
        bar = { foo }
        `);
    });

    test('returns ???', function(){
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, {sel: 'a'}, errs);
      assert.strictEqual(val, '{???}');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });

    test('returns the other member if requested', function(){
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, {sel: 'b'}, errs);
      assert.strictEqual(val, 'Bar');
      assert.strictEqual(errs.length, 0);
    });
  });

  suite('Cyclic reference in a selector', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
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
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  suite('Cyclic self-reference in a selector', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
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
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'Foo');
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });

    test('can reference an attribute', function(){
      const msg = bundle.getMessage('bar');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'Bar');
      assert.strictEqual(errs.length, 0);
    });
  });
});
