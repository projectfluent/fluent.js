import assert from 'assert';

import CachedIterable from '../src/cached_iterable';

/**
 * Return a promise for an array with all the elements of the iterable.
 *
 * It uses for-await to support async iterables which can't be spread with
 * ...iterable. See https://github.com/tc39/proposal-async-iteration/issues/103
 *
 */
async function toArray(iterable) {
  const result = [];
  for await (const elem of iterable) {
    result.push(elem);
  }
  return result;
}

suite('CachedIterable', function() {
  suite('constructor errors', function(){
    test('no argument', function() {
      function run() {
        new CachedIterable();
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });

    test('null argument', function() {
      function run() {
        new CachedIterable(null);
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });

    test('bool argument', function() {
      function run() {
        new CachedIterable(1);
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });

    test('number argument', function() {
      function run() {
        new CachedIterable(1);
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });
  });

  suite('sync iteration', function(){
    let o1, o2;

    suiteSetup(function() {
      o1 = Object();
      o2 = Object();
    });

    test('eager iterable', function() {
      const iterable = new CachedIterable([o1, o2]);
      assert.deepEqual([...iterable], [o1, o2]);
    });

    test('eager iterable works more than once', function() {
      const iterable = new CachedIterable([o1, o2]);
      assert.deepEqual([...iterable], [o1, o2]);
      assert.deepEqual([...iterable], [o1, o2]);
    });

    test('lazy iterable', function() {
      function *generate() {
        yield *[o1, o2];
      }

      const iterable = new CachedIterable(generate());
      assert.deepEqual([...iterable], [o1, o2]);
    });

    test('lazy iterable works more than once', function() {
      function *generate() {
        let i = 2;

        while (--i) {
          yield Object();
        }
      }

      const iterable = new CachedIterable(generate());
      const first = [...iterable];
      assert.deepEqual([...iterable], first);
    });
  });

  suite('async iteration', function(){
    let o1, o2;

    suiteSetup(function() {
      o1 = Object();
      o2 = Object();
    });

    test('lazy iterable', async function() {
      async function *generate() {
        yield *[o1, o2];
      }

      const iterable = new CachedIterable(generate());
      assert.deepEqual(await toArray(iterable), [o1, o2]);
    });

    test('lazy iterable works more than once', async function() {
      async function *generate() {
        let i = 2;

        while (--i) {
          yield Object();
        }
      }

      const iterable = new CachedIterable(generate());
      const first = await toArray(iterable);
      assert.deepEqual(await toArray(iterable), first);
    });
  });

  suite('touchNext', function(){
    let o1, o2;

    suiteSetup(function() {
      o1 = Object();
      o2 = Object();
    });

    test('consumes an element into the cache', function() {
      const iterable = new CachedIterable([o1, o2]);
      assert.equal(iterable.seen.length, 0);
      iterable.touchNext();
      assert.equal(iterable.seen.length, 1);
    });

    test('allows to consume multiple elements into the cache', function() {
      const iterable = new CachedIterable([o1, o2]);
      iterable.touchNext();
      iterable.touchNext();
      assert.equal(iterable.seen.length, 2);
    });

    test('stops at the last element', function() {
      const iterable = new CachedIterable([o1, o2]);
      iterable.touchNext();
      iterable.touchNext();
      iterable.touchNext();
      assert.equal(iterable.seen.length, 3);

      iterable.touchNext();
      assert.equal(iterable.seen.length, 3);
    });

    test('works on an empty iterable', function() {
      const iterable = new CachedIterable([]);
      iterable.touchNext();
      iterable.touchNext();
      iterable.touchNext();
      assert.equal(iterable.seen.length, 1);
    });

    test('iteration for such cache works', function() {
      const iterable = new CachedIterable([o1, o2]);
      iterable.touchNext();
      iterable.touchNext();
      iterable.touchNext();
      assert.deepEqual([...iterable], [o1, o2]);
    });
  });
});
