'use strict';

import assert from 'assert';
import sinon from 'sinon';
import ftl from "@fluent/dedent";

import {FluentBundle} from '../esm/bundle.js';
import {FluentResource} from '../esm/resource.js';

suite('FluentBundle constructor', function() {
  let nfSpy;
  setup(() => {
    nfSpy = sinon.spy(Intl, 'NumberFormat');
  });

  teardown(() => {
    nfSpy.restore();
  });

  test('accepts a single locale string', function() {
    const errs = [];
    const bundle = new FluentBundle('en-US', { useIsolating: false });
    bundle.addResource(new FluentResource(ftl`
      foo = Foo { 1 }
      `));

    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);

    assert.strictEqual(val, 'Foo 1');
    assert.strictEqual(errs.length, 0);
    
    const locale = nfSpy.lastCall.args[0];
    assert.deepEqual(locale, ['en-US']);
  });

  test('accepts an array of locales', function() {
    const errs = [];
    const bundle = new FluentBundle(['de', 'en-US'], { useIsolating: false });
    bundle.addResource(new FluentResource(ftl`
      foo = Foo { 1 }
      `));

    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);

    assert.strictEqual(val, 'Foo 1');
    assert.strictEqual(errs.length, 0);

    const locales = nfSpy.lastCall.args[0];
    assert.deepEqual(locales, ['de', 'en-US']);
  });
});
