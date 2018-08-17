import assert from 'assert';

import {CachedSyncIterable} from 'cached-iterable';
import FluentBundle from './bundle_stub';
import {mapBundleSync} from '../src/index';

suite('Sync Fallback — single id', function() {
  let bundle1, bundle2;

  suiteSetup(function() {
    bundle1 = new FluentBundle();
    bundle1._setMessages(['bar']);
    bundle2 = new FluentBundle();
    bundle2._setMessages(['foo', 'bar']);
  });

  test('eager iterable', function() {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.equal(mapBundleSync(bundles, 'foo'), bundle2);
    assert.equal(mapBundleSync(bundles, 'bar'), bundle1);
  });

  test('eager iterable works more than once', function() {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.equal(mapBundleSync(bundles, 'foo'), bundle2);
    assert.equal(mapBundleSync(bundles, 'bar'), bundle1);
    assert.equal(mapBundleSync(bundles, 'foo'), bundle2);
    assert.equal(mapBundleSync(bundles, 'bar'), bundle1);
  });

  test('lazy iterable', function() {
    function *generateBundles() {
      yield *[bundle1, bundle2];
    }

    const bundles = new CachedSyncIterable(generateBundles());
    assert.equal(mapBundleSync(bundles, 'foo'), bundle2);
    assert.equal(mapBundleSync(bundles, 'bar'), bundle1);
  });

  test('lazy iterable works more than once', function() {
    function *generateBundles() {
      yield *[bundle1, bundle2];
    }

    const bundles = new CachedSyncIterable(generateBundles());
    assert.equal(mapBundleSync(bundles, 'foo'), bundle2);
    assert.equal(mapBundleSync(bundles, 'bar'), bundle1);
    assert.equal(mapBundleSync(bundles, 'foo'), bundle2);
    assert.equal(mapBundleSync(bundles, 'bar'), bundle1);
  });
});

suite('Sync Fallback — multiple ids', function() {
  let bundle1, bundle2;

  suiteSetup(function() {
    bundle1 = new FluentBundle();
    bundle1._setMessages(['foo', 'bar']);
    bundle2 = new FluentBundle();
    bundle2._setMessages(['foo', 'bar', 'baz']);
  });

  test('existing translations', function() {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.deepEqual(
      mapBundleSync(bundles, ['foo', 'bar']),
      [bundle1, bundle1]
    );
  });

  test('fallback translations', function() {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.deepEqual(
      mapBundleSync(bundles, ['foo', 'bar', 'baz']),
      [bundle1, bundle1, bundle2]
    );
  });

  test('missing translations', function() {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.deepEqual(
      mapBundleSync(bundles, ['foo', 'bar', 'baz', 'qux']),
      [bundle1, bundle1, bundle2, null]
    );
  });
});
