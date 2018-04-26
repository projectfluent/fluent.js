import assert from 'assert';

import { CachedSyncIterable } from '../src/cached_iterable';
import MessageContext from './message_context_stub';
import { mapContextSync } from '../src/index';

suite('Sync Fallback — single id', function() {
  let ctx1, ctx2;

  suiteSetup(function() {
    ctx1 = new MessageContext();
    ctx1._setMessages(['bar']);
    ctx2 = new MessageContext();
    ctx2._setMessages(['foo', 'bar']);
  });

  test('eager iterable', function() {
    const contexts = new CachedSyncIterable([ctx1, ctx2]);
    assert.equal(mapContextSync(contexts, 'foo'), ctx2);
    assert.equal(mapContextSync(contexts, 'bar'), ctx1);
  });

  test('eager iterable works more than once', function() {
    const contexts = new CachedSyncIterable([ctx1, ctx2]);
    assert.equal(mapContextSync(contexts, 'foo'), ctx2);
    assert.equal(mapContextSync(contexts, 'bar'), ctx1);
    assert.equal(mapContextSync(contexts, 'foo'), ctx2);
    assert.equal(mapContextSync(contexts, 'bar'), ctx1);
  });

  test('lazy iterable', function() {
    function *generateMessages() {
      yield *[ctx1, ctx2];
    }

    const contexts = new CachedSyncIterable(generateMessages());
    assert.equal(mapContextSync(contexts, 'foo'), ctx2);
    assert.equal(mapContextSync(contexts, 'bar'), ctx1);
  });

  test('lazy iterable works more than once', function() {
    function *generateMessages() {
      yield *[ctx1, ctx2];
    }

    const contexts = new CachedSyncIterable(generateMessages());
    assert.equal(mapContextSync(contexts, 'foo'), ctx2);
    assert.equal(mapContextSync(contexts, 'bar'), ctx1);
    assert.equal(mapContextSync(contexts, 'foo'), ctx2);
    assert.equal(mapContextSync(contexts, 'bar'), ctx1);
  });
});

suite('Sync Fallback — multiple ids', function() {
  let ctx1, ctx2;

  suiteSetup(function() {
    ctx1 = new MessageContext();
    ctx1._setMessages(['foo', 'bar']);
    ctx2 = new MessageContext();
    ctx2._setMessages(['foo', 'bar', 'baz']);
  });

  test('existing translations', function() {
    const contexts = new CachedSyncIterable([ctx1, ctx2]);
    assert.deepEqual(
      mapContextSync(contexts, ['foo', 'bar']),
      [ctx1, ctx1]
    );
  });

  test('fallback translations', function() {
    const contexts = new CachedSyncIterable([ctx1, ctx2]);
    assert.deepEqual(
      mapContextSync(contexts, ['foo', 'bar', 'baz']),
      [ctx1, ctx1, ctx2]
    );
  });

  test('missing translations', function() {
    const contexts = new CachedSyncIterable([ctx1, ctx2]);
    assert.deepEqual(
      mapContextSync(contexts, ['foo', 'bar', 'baz', 'qux']),
      [ctx1, ctx1, ctx2, null]
    );
  });
});
