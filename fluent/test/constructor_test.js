'use strict';

import assert from 'assert';
import sinon from 'sinon';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('MessageContext constructor', function() {
  setup(function() {
    this.nf = sinon.spy(Intl, 'NumberFormat');
  });

  teardown(function() {
    this.nf.restore();
  });

  test('accepts a single locale string', function() {
    const errs = [];
    const ctx = new MessageContext('en-US', { useIsolating: false });
    ctx.addMessages(ftl`
      foo = Foo { 1 }
    `);

    const msg = ctx.messages.get('foo');
    const val = ctx.format(msg, null, errs);

    assert.equal(val, 'Foo 1');
    assert.equal(errs.length, 0);
    
    const locale = this.nf.getCall(0).args[0];
    assert.equal(locale, 'en-US');
  });

  test('accepts an array of locales', function() {
    const errs = [];
    const ctx = new MessageContext(['de', 'en-US'], { useIsolating: false });
    ctx.addMessages(ftl`
      foo = Foo { 1 }
    `);

    const msg = ctx.messages.get('foo');
    const val = ctx.format(msg, null, errs);

    assert.equal(val, 'Foo 1');
    assert.equal(errs.length, 0);

    const locales = this.nf.getCall(0).args[0];
    assert.deepEqual(locales, ['de', 'en-US']);
  });
});
