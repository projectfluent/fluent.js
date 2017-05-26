import assert from 'assert';

import { MessageSyncSequence } from '../src/sequence';
import MessageContext from './message_context_stub';
import { ftl } from './util';

suite('Sequence', function() {
  suite('setIterable errors', function(){
    let seq;

    setup(function() {
      seq = new MessageSyncSequence();
    });

    test('no argument', function() {
      function run() {
        seq.setIterable();
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });

    test('null argument', function() {
      function run() {
        seq.setIterable(null);
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });

    test('bool argument', function() {
      function run() {
        seq.setIterable(1);
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });

    test('number argument', function() {
      function run() {
        seq.setIterable(1);
      }

      assert.throws(run, TypeError);
      assert.throws(run, /iteration protocol/);
    });
  });

  suite('setIterable', function(){
    let ctx1, ctx2;

    suiteSetup(function() {
      ctx1 = new MessageContext();
      ctx1._setMessages(['bar']);
      ctx2 = new MessageContext();
      ctx2._setMessages(['foo', 'bar']);
    });

    test('eager iterable', function() {
      const seq = new MessageSyncSequence();
      seq.setIterable([ctx1, ctx2]);

      assert.equal(seq.mapContext('foo'), ctx2);
      assert.equal(seq.mapContext('bar'), ctx1);
    });

    test('eager iterable works more than once', function() {
      const seq = new MessageSyncSequence();
      seq.setIterable([ctx1, ctx2]);

      assert.equal(seq.mapContext('foo'), ctx2);
      assert.equal(seq.mapContext('bar'), ctx1);
      assert.equal(seq.mapContext('foo'), ctx2);
      assert.equal(seq.mapContext('bar'), ctx1);
    });

    test('lazy iterable', function() {
      function *generateMessages() {
        yield *[ctx1, ctx2];
      }

      const seq = new MessageSyncSequence();
      seq.setIterable(generateMessages());

      assert.equal(seq.mapContext('foo'), ctx2);
      assert.equal(seq.mapContext('bar'), ctx1);
    });

    test('lazy iterable works more than once', function() {
      function *generateMessages() {
        yield *[ctx1, ctx2];
      }

      const seq = new MessageSyncSequence();
      seq.setIterable(generateMessages());

      assert.equal(seq.mapContext('foo'), ctx2);
      assert.equal(seq.mapContext('bar'), ctx1);
      assert.equal(seq.mapContext('foo'), ctx2);
      assert.equal(seq.mapContext('bar'), ctx1);
    });
  });
});
