import assert from 'assert';

import {CachedAsyncIterable} from 'cached-iterable';
import FluentBundle from './bundle_stub';
import {mapBundleAsync} from '../src/index';

suite('Async Fallback — single id', function() {
  let bundle1, bundle2, generateBundles;

  suiteSetup(function() {
    bundle1 = new FluentBundle();
    bundle1._setMessages(['bar']);
    bundle2 = new FluentBundle();
    bundle2._setMessages(['foo', 'bar']);

    generateBundles = async function *generateBundles() {
      yield *[bundle1, bundle2];
    }
  });

  test('eager iterable', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.equal(await mapBundleAsync(bundles, 'foo'), bundle2);
    assert.equal(await mapBundleAsync(bundles, 'bar'), bundle1);
  });

  test('eager iterable works more than once', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.equal(await mapBundleAsync(bundles, 'foo'), bundle2);
    assert.equal(await mapBundleAsync(bundles, 'bar'), bundle1);
    assert.equal(await mapBundleAsync(bundles, 'foo'), bundle2);
    assert.equal(await mapBundleAsync(bundles, 'bar'), bundle1);
  });

  test('lazy iterable', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.equal(await mapBundleAsync(bundles, 'foo'), bundle2);
    assert.equal(await mapBundleAsync(bundles, 'bar'), bundle1);
  });

  test('lazy iterable works more than once', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.equal(await mapBundleAsync(bundles, 'foo'), bundle2);
    assert.equal(await mapBundleAsync(bundles, 'bar'), bundle1);
    assert.equal(await mapBundleAsync(bundles, 'foo'), bundle2);
    assert.equal(await mapBundleAsync(bundles, 'bar'), bundle1);
  });
});

suite('Async Fallback — multiple ids', async function() {
  let bundle1, bundle2, generateBundles;

  suiteSetup(function() {
    bundle1 = new FluentBundle();
    bundle1._setMessages(['foo', 'bar']);
    bundle2 = new FluentBundle();
    bundle2._setMessages(['foo', 'bar', 'baz']);

    generateBundles = async function *generateBundles() {
      yield *[bundle1, bundle2];
    }
  });

  test('existing translations', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.deepEqual(
      await mapBundleAsync(bundles, ['foo', 'bar']),
      [bundle1, bundle1]
    );
  });

  test('fallback translations', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.deepEqual(
      await mapBundleAsync(bundles, ['foo', 'bar', 'baz']),
      [bundle1, bundle1, bundle2]
    );
  });

  test('missing translations', async function() {
    const bundles = new CachedAsyncIterable(generateBundles());
    assert.deepEqual(
      await mapBundleAsync(bundles, ['foo', 'bar', 'baz', 'qux']),
      [bundle1, bundle1, bundle2, null]
    );
  });
});

suite('Async Fallback — early return', async function() {
  let bundle1, bundle2;

  suiteSetup(function() {
    bundle1 = new FluentBundle();
    bundle1._setMessages(['foo', 'bar']);
    bundle2 = new FluentBundle();
    bundle2._setMessages(['foo', 'bar', 'baz']);
  });

  test('break early if possible', async function() {
    const bundles = [bundle1, bundle2].values();
    assert.deepEqual(
      await mapBundleAsync(bundles, ['foo', 'bar']),
      [bundle1, bundle1]
    );
    assert.deepEqual(
      bundles.next(),
      {value: bundle2, done: false}
    );
  });

  test('iterate over all bundles', async function() {
    const bundles = [bundle1, bundle2].values();
    assert.deepEqual(
      await mapBundleAsync(bundles, ['foo', 'bar', 'baz']),
      [bundle1, bundle1, bundle2]
    );
    assert.deepEqual(
      bundles.next(),
      {value: undefined, done: true}
    );
  });
});
