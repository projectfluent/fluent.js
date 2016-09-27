'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl, bdi } from '../util';

describe('Patterns', function(){
  let ctx, args, errs;

  before(function() {
    ctx = new MessageContext('en-US');
  });

  beforeEach(function() {
    errs = [];
  });


  describe('Simple string value', function(){
    before(function() {
      ctx.addMessages(ftl`
        foo = Foo
      `);
    });

    it('returns the value', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.deepEqual(errs, []);
    });
  });

  describe('Complex string value', function(){
    before(function() {
      ctx.addMessages(ftl`
        foo = Foo
        bar = { foo } Bar
        baz = { missing }
        qux = { malformed
      `);
    });

    it('returns the value', function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, bdi`[Foo] Bar`);
      assert.deepEqual(errs, []);
    });

    it('returns the raw string if the referenced entity is ' +
       'not found', function(){
      const msg = ctx.messages.get('baz');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, bdi`[missing]`);
      assert.ok(errs[0] instanceof ReferenceError); // unknown entity
    });
  });

  describe('Complex string referencing an entity with null value', function(){
    before(function() {
      ctx.addMessages(ftl`
        foo =
            [attr] Foo Attr
        bar = { foo } Bar
      `);
    });

    it('returns the null value', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, null);
      assert.deepEqual(errs, []);
    });

    it('formats the trait', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg.traits[0], args, errs);
      assert.strictEqual(val, 'Foo Attr');
      assert.deepEqual(errs, []);
    });

    it('formats ??? when the referenced entity has no value and no default',
       function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, bdi`[???] Bar`);
      assert.ok(errs[0] instanceof RangeError); // no default
    });
  });

  describe('Cyclic reference', function(){
    before(function() {
      ctx.addMessages(ftl`
        foo = { bar }
        bar = { foo }
      `);
    });

    it('returns ???', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, bdi`[[???]]`);
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  describe('Cyclic self-reference', function(){
    before(function() {
      ctx.addMessages(ftl`
        foo = { foo }
      `);
    });

    it('returns the raw string', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.strictEqual(val, bdi`[???]`);
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });
  });

  describe('Cyclic self-reference in a member', function(){
    before(function() {
      ctx.addMessages(ftl`
        foo = { $sel ->
            [a] { foo }
            [b] Bar
        }
        bar = { foo }
      `);
    });

    it('returns ???', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, {sel: 'a'}, errs);
      assert.strictEqual(val, bdi`[[???]]`);
      assert.ok(errs[0] instanceof RangeError); // cyclic reference
    });

    it('returns the other member if requested', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, {sel: 'b'}, errs);
      assert.strictEqual(val, bdi`[Bar]`);
      assert.deepEqual(errs, []);
    });
  });

});
