'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Attributes', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('missing', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
            .attr = Bar Attribute
        baz = { foo } Baz
        qux = { foo } Qux
            .attr = Qux Attribute

        ref-foo = { foo.missing }
        ref-bar = { bar.missing }
        ref-baz = { baz.missing }
        ref-qux = { qux.missing }
      `);
    });

    test('falls back gracefully for entities with string values and no attributes', function() {
      const msg = ctx.getMessage('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    test('falls back gracefully for entities with string values and other attributes', function() {
      const msg = ctx.getMessage('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    test('falls back gracefully for entities with pattern values and no attributes', function() {
      const msg = ctx.getMessage('ref-baz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Baz');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    test('falls back gracefully for entities with pattern values and other attributes', function() {
      const msg = ctx.getMessage('ref-qux');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Qux');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });
  });

  suite('with string values', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
            .attr = Foo Attribute
        bar = { foo } Bar
            .attr = Bar Attribute

        ref-foo = { foo.attr }
        ref-bar = { bar.attr }
      `);
    });

    test('can be referenced for entities with string values', function() {
      const msg = ctx.getMessage('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be formatted directly for entities with string values', function() {
      const msg = ctx.getMessage('foo').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be referenced for entities with pattern values', function() {
      const msg = ctx.getMessage('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be formatted directly for entities with pattern values', function() {
      const msg = ctx.getMessage('bar').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });
  });

  suite('with simple pattern values', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
            .attr = { foo } Attribute
        baz = { foo } Baz
            .attr = { foo } Attribute
        qux = Qux
            .attr = { qux } Attribute

        ref-bar = { bar.attr }
        ref-baz = { baz.attr }
        ref-qux = { qux.attr }
      `);
    });

    test('can be referenced for entities with string values', function() {
      const msg = ctx.getMessage('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be formatted directly for entities with string values', function() {
      const msg = ctx.getMessage('bar').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be referenced for entities with simple pattern values', function() {
      const msg = ctx.getMessage('ref-baz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be formatted directly for entities with simple pattern values', function() {
      const msg = ctx.getMessage('baz').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    test('works with self-references', function() {
      const msg = ctx.getMessage('ref-qux');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Qux Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be formatted directly when it uses a self-reference', function() {
      const msg = ctx.getMessage('qux').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Qux Attribute');
      assert.equal(errs.length, 0);
    });
  });

  suite('with values with select expressions', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
            .attr = { "a" ->
                        [a] A
                       *[b] B
                    }

        ref-foo = { foo.attr }
      `);
    });

    test('can be referenced', function() {
      const msg = ctx.getMessage('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });

    test('can be formatted directly', function() {
      const msg = ctx.getMessage('foo').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });
});
