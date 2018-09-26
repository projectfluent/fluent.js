'use strict';

import assert from 'assert';
import sinon from 'sinon';

import FluentBundle from '../src/context';
import { ftl } from '../src/util';

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
    const val = bundle.format(msg, null, errs);

    assert.equal(val, 'Foo 1');
    assert.equal(errs.length, 0);
    
    const locale = this.nf.getCall(0).args[0];
    assert.equal(locale, 'en-US');
  });

  test('accepts an array of locales', function() {
    const errs = [];
    const bundle = new FluentBundle(['de', 'en-US'], { useIsolating: false });
    bundle.addMessages(ftl`
      foo = Foo { 1 }
    `);

    const msg = bundle.getMessage('foo');
    const val = bundle.format(msg, null, errs);

    assert.equal(val, 'Foo 1');
    assert.equal(errs.length, 0);

    const locales = this.nf.getCall(0).args[0];
    assert.deepEqual(locales, ['de', 'en-US']);
  });
});
