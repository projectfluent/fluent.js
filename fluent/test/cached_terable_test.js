import assert from 'assert';

import CachedIterable from '../src/cached_iterable';

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

  suite('iteration', function(){
    let o1, o2;

    suiteSetup(function() {
      o1 = Object();
      o2 = Object();
    });

    test('eager iterable', function() {
      const iter = new CachedIterable([o1, o2]);
      assert.deepEqual([...iter], [o1, o2]);
    });

    test('eager iterable works more than once', function() {
      const iter = new CachedIterable([o1, o2]);
      assert.deepEqual([...iter], [o1, o2]);
      assert.deepEqual([...iter], [o1, o2]);
    });

    test('lazy iterable', function() {
      function *generate() {
        yield *[o1, o2];
      }

      const iter = new CachedIterable(generate());
      assert.deepEqual([...iter], [o1, o2]);
    });

    test('lazy iterable works more than once', function() {
      function *generate() {
        let i = 2;

        while (--i) {
          yield Object();
        }
      }

      const iter = new CachedIterable(generate());
      const first = [...iter];
      assert.deepEqual([...iter], first);
    });
  });
});
