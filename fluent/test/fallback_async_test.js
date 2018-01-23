import assert from 'assert';

import CachedIterable from '../src/cached_iterable';
import MessageContext from './message_context_stub';
import { mapContextAsync } from '../src/index';

suite('Async Fallback — single id', function() {
  let ctx1, ctx2;

  suiteSetup(function() {
    ctx1 = new MessageContext();
    ctx1._setMessages(['bar']);
    ctx2 = new MessageContext();
    ctx2._setMessages(['foo', 'bar']);
  });

  test('eager iterable', async function() {
    const contexts = new CachedIterable([ctx1, ctx2]);
    assert.equal(await mapContextAsync(contexts, 'foo'), ctx2);
    assert.equal(await mapContextAsync(contexts, 'bar'), ctx1);
  });

  test('eager iterable works more than once', async function() {
    const contexts = new CachedIterable([ctx1, ctx2]);
    assert.equal(await mapContextAsync(contexts, 'foo'), ctx2);
    assert.equal(await mapContextAsync(contexts, 'bar'), ctx1);
    assert.equal(await mapContextAsync(contexts, 'foo'), ctx2);
    assert.equal(await mapContextAsync(contexts, 'bar'), ctx1);
  });

  test('lazy iterable', async function() {
    async function *generateMessages() {
      yield *[ctx1, ctx2];
    }

    const contexts = new CachedIterable(generateMessages());
    assert.equal(await mapContextAsync(contexts, 'foo'), ctx2);
    assert.equal(await mapContextAsync(contexts, 'bar'), ctx1);
  });

  test('lazy iterable works more than once', async function() {
    async function *generateMessages() {
      yield *[ctx1, ctx2];
    }

    const contexts = new CachedIterable(generateMessages());
    assert.equal(await mapContextAsync(contexts, 'foo'), ctx2);
    assert.equal(await mapContextAsync(contexts, 'bar'), ctx1);
    assert.equal(await mapContextAsync(contexts, 'foo'), ctx2);
    assert.equal(await mapContextAsync(contexts, 'bar'), ctx1);
  });
});

suite('Async Fallback — multiple ids', async function() {
  let ctx1, ctx2;

  suiteSetup(function() {
    ctx1 = new MessageContext();
    ctx1._setMessages(['foo', 'bar']);
    ctx2 = new MessageContext();
    ctx2._setMessages(['foo', 'bar', 'baz']);
  });

  test('existing translations', async function() {
    const contexts = new CachedIterable([ctx1, ctx2]);
    assert.deepEqual(
      await mapContextAsync(contexts, ['foo', 'bar']),
      [ctx1, ctx1]
    );
  });

  test('fallback translations', async function() {
    const contexts = new CachedIterable([ctx1, ctx2]);
    assert.deepEqual(
      await mapContextAsync(contexts, ['foo', 'bar', 'baz']),
      [ctx1, ctx1, ctx2]
    );
  });

  test('missing translations', async function() {
    const contexts = new CachedIterable([ctx1, ctx2]);
    assert.deepEqual(
      await mapContextAsync(contexts, ['foo', 'bar', 'baz', 'qux']),
      [ctx1, ctx1, ctx2, null]
    );
  });
});

suite('Async Fallback — early return', async function() {
  let ctx1, ctx2;

  suiteSetup(function() {
    ctx1 = new MessageContext();
    ctx1._setMessages(['foo', 'bar']);
    ctx2 = new MessageContext();
    ctx2._setMessages(['foo', 'bar', 'baz']);
  });

  test('break early if possible', async function() {
    const contexts = [ctx1, ctx2].values();
    assert.deepEqual(
      await mapContextAsync(contexts, ['foo', 'bar']),
      [ctx1, ctx1]
    );
    assert.deepEqual(
      contexts.next(),
      {value: ctx2, done: false}
    );
  });

  test('iterate over all contexts', async function() {
    const contexts = [ctx1, ctx2].values();
    assert.deepEqual(
      await mapContextAsync(contexts, ['foo', 'bar', 'baz']),
      [ctx1, ctx1, ctx2]
    );
    assert.deepEqual(
      contexts.next(),
      {value: undefined, done: true}
    );
  });
});
