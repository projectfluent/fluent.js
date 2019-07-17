'use strict';

import assert from 'assert';
import sinon from 'sinon';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';

suite('FluentBundle constructor', function() {
  setup(function() {
    this.nf = sinon.spy(Intl, 'NumberFormat');
  });

  teardown(function() {
    this.nf.restore();
  });

  test('accepts a single locale string', function() {
    const errs = [];
    const bundle = new FluentBundle('en-US', { useIsolating: false });
    bundle.addMessages(ftl`
      foo = Foo { 1 }
      `);

    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);

    assert.strictEqual(val, 'Foo 1');
    assert.strictEqual(errs.length, 0);
    
    const locale = this.nf.getCall(0).args[0];
    assert.deepEqual(locale, ['en-US']);
  });

  test('accepts an array of locales', function() {
    const errs = [];
    const bundle = new FluentBundle(['de', 'en-US'], { useIsolating: false });
    bundle.addMessages(ftl`
      foo = Foo { 1 }
      `);

    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);

    assert.strictEqual(val, 'Foo 1');
    assert.strictEqual(errs.length, 0);

    const locales = this.nf.getCall(0).args[0];
    assert.deepEqual(locales, ['de', 'en-US']);
  });
});
