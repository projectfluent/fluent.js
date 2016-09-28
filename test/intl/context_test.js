'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl, bdi } from '../util';

describe('Context', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('Billion Laughs', function(){
    before(function() {
      ctx = new MessageContext('en-US');
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
      `);
    });

    it('preserves existing messages when new are added', function() {
      ctx.addMessages(ftl`
        baz = Baz
      `);
      assert(ctx.messages.has('foo'));
      assert(ctx.messages.has('bar'));
      assert(ctx.messages.has('baz'));
    });

    it('overwrites existing messages if the ids are the same', function() {
      ctx.addMessages(ftl`
        foo = New Foo
      `);
      assert(ctx.messages.has('foo'));
      assert(ctx.messages.has('bar'));
      assert(ctx.messages.has('baz'));
      assert.equal(ctx.messages.size, 3);

      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'New Foo');
      assert.equal(errs.length, 0);
    });
  });


});
