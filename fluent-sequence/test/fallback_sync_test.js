import assert from "assert";

import { CachedSyncIterable } from "cached-iterable";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { mapBundleSync } from "../esm/index.js";

suite("Sync Fallback — single id", function () {
  let bundle1, bundle2;

  beforeAll(function () {
    bundle1 = new FluentBundle();
    bundle1.addResource(new FluentResource("bar=Bar"));
    bundle2 = new FluentBundle();
    bundle2.addResource(new FluentResource("foo=Foo\nbar=Bar"));
  });

  test("eager iterable", function () {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.strictEqual(mapBundleSync(bundles, "foo"), bundle2);
    assert.strictEqual(mapBundleSync(bundles, "bar"), bundle1);
  });

  test("eager iterable works more than once", function () {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.strictEqual(mapBundleSync(bundles, "foo"), bundle2);
    assert.strictEqual(mapBundleSync(bundles, "bar"), bundle1);
    assert.strictEqual(mapBundleSync(bundles, "foo"), bundle2);
    assert.strictEqual(mapBundleSync(bundles, "bar"), bundle1);
  });

  test("lazy iterable", function () {
    function* generateBundles() {
      yield* [bundle1, bundle2];
    }

    const bundles = new CachedSyncIterable(generateBundles());
    assert.strictEqual(mapBundleSync(bundles, "foo"), bundle2);
    assert.strictEqual(mapBundleSync(bundles, "bar"), bundle1);
  });

  test("lazy iterable works more than once", function () {
    function* generateBundles() {
      yield* [bundle1, bundle2];
    }

    const bundles = new CachedSyncIterable(generateBundles());
    assert.strictEqual(mapBundleSync(bundles, "foo"), bundle2);
    assert.strictEqual(mapBundleSync(bundles, "bar"), bundle1);
    assert.strictEqual(mapBundleSync(bundles, "foo"), bundle2);
    assert.strictEqual(mapBundleSync(bundles, "bar"), bundle1);
  });
});

suite("Sync Fallback — multiple ids", function () {
  let bundle1, bundle2;

  beforeAll(function () {
    bundle1 = new FluentBundle();
    bundle1.addResource(new FluentResource("foo=Foo\nbar=Bar"));
    bundle2 = new FluentBundle();
    bundle2.addResource(new FluentResource("foo=Foo\nbar=Bar\nbaz=Baz"));
  });

  test("existing translations", function () {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.deepEqual(mapBundleSync(bundles, ["foo", "bar"]), [
      bundle1,
      bundle1,
    ]);
  });

  test("fallback translations", function () {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.deepEqual(mapBundleSync(bundles, ["foo", "bar", "baz"]), [
      bundle1,
      bundle1,
      bundle2,
    ]);
  });

  test("missing translations", function () {
    const bundles = new CachedSyncIterable([bundle1, bundle2]);
    assert.deepEqual(mapBundleSync(bundles, ["foo", "bar", "baz", "qux"]), [
      bundle1,
      bundle1,
      bundle2,
      null,
    ]);
  });
});
