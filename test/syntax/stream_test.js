'use strict';

import assert from 'assert';
import { ParserStream } from '../../src/syntax/stream';

describe('ParserStream', function() {
  it('next', function() {
    let ps = new ParserStream("abcd");

    assert.strictEqual('a', ps.current());
    assert.strictEqual(0, ps.getIndex());

    assert.strictEqual('b', ps.next());
    assert.strictEqual('b', ps.current());
    assert.strictEqual(1, ps.getIndex());

    assert.strictEqual('c', ps.next());
    assert.strictEqual('c', ps.current());
    assert.strictEqual(2, ps.getIndex());

    assert.strictEqual('d', ps.next());
    assert.strictEqual('d', ps.current());
    assert.strictEqual(3, ps.getIndex());

    assert.strictEqual(undefined, ps.next());
    assert.strictEqual(undefined, ps.current());
    assert.strictEqual(4, ps.getIndex());
  });

  it('peek', function() {
    let ps = new ParserStream("abcd");

    assert.strictEqual('a', ps.currentPeek());
    assert.strictEqual(0, ps.getPeekIndex());

    assert.strictEqual('b', ps.peek());
    assert.strictEqual('b', ps.currentPeek());
    assert.strictEqual(1, ps.getPeekIndex());

    assert.strictEqual('c', ps.peek());
    assert.strictEqual('c', ps.currentPeek());
    assert.strictEqual(2, ps.getPeekIndex());

    assert.strictEqual('d', ps.peek());
    assert.strictEqual('d', ps.currentPeek());
    assert.strictEqual(3, ps.getPeekIndex());

    assert.strictEqual(undefined, ps.peek());
    assert.strictEqual(undefined, ps.currentPeek());
    assert.strictEqual(4, ps.getPeekIndex());
  });

  it('peek_and_next', function() {
    let ps = new ParserStream("abcd");

    assert.strictEqual('b', ps.peek());
    assert.strictEqual(1, ps.getPeekIndex());
    assert.strictEqual(0, ps.getIndex());

    assert.strictEqual('b', ps.next());
    assert.strictEqual(1, ps.getPeekIndex());
    assert.strictEqual(1, ps.getIndex());

    assert.strictEqual('c', ps.peek());
    assert.strictEqual(2, ps.getPeekIndex());
    assert.strictEqual(1, ps.getIndex());

    assert.strictEqual('c', ps.next());
    assert.strictEqual(2, ps.getPeekIndex());
    assert.strictEqual(2, ps.getIndex());
    assert.strictEqual('c', ps.current());
    assert.strictEqual('c', ps.currentPeek());

    assert.strictEqual('d', ps.peek());
    assert.strictEqual(3, ps.getPeekIndex());
    assert.strictEqual(2, ps.getIndex());

    assert.strictEqual('d', ps.next());
    assert.strictEqual(3, ps.getPeekIndex());
    assert.strictEqual(3, ps.getIndex());
    assert.strictEqual('d', ps.current());
    assert.strictEqual('d', ps.currentPeek());

    assert.strictEqual(undefined, ps.peek());
    assert.strictEqual(4, ps.getPeekIndex());
    assert.strictEqual(3, ps.getIndex());
    assert.strictEqual('d', ps.current());
    assert.strictEqual(undefined, ps.currentPeek());

    assert.strictEqual(undefined, ps.peek());
    assert.strictEqual(4, ps.getPeekIndex());
    assert.strictEqual(3, ps.getIndex());

    assert.strictEqual(undefined, ps.next());
    assert.strictEqual(4, ps.getPeekIndex());
    assert.strictEqual(4, ps.getIndex());
  });

  it('skip_to_peek', function() {
    let ps = new ParserStream("abcd");

    ps.peek();
    ps.peek();

    ps.skipToPeek();

    assert.strictEqual('c', ps.current());
    assert.strictEqual('c', ps.currentPeek());
    assert.strictEqual(2, ps.getPeekIndex());
    assert.strictEqual(2, ps.getIndex());

    ps.peek();

    assert.strictEqual('c', ps.current());
    assert.strictEqual('d', ps.currentPeek());
    assert.strictEqual(3, ps.getPeekIndex());
    assert.strictEqual(2, ps.getIndex());

    ps.next();

    assert.strictEqual('d', ps.current());
    assert.strictEqual('d', ps.currentPeek());
    assert.strictEqual(3, ps.getPeekIndex());
    assert.strictEqual(3, ps.getIndex());
  });

  it('reset_peek', function() {
    let ps = new ParserStream("abcd");

    ps.next();
    ps.peek();
    ps.peek();
    ps.resetPeek();

    assert.strictEqual('b', ps.current());
    assert.strictEqual('b', ps.currentPeek());
    assert.strictEqual(1, ps.getPeekIndex());
    assert.strictEqual(1, ps.getIndex());

    ps.peek();

    assert.strictEqual('b', ps.current());
    assert.strictEqual('c', ps.currentPeek());
    assert.strictEqual(2, ps.getPeekIndex());
    assert.strictEqual(1, ps.getIndex());

    ps.peek();
    ps.peek();
    ps.peek();
    ps.resetPeek();

    assert.strictEqual('b', ps.current());
    assert.strictEqual('b', ps.currentPeek());
    assert.strictEqual(1, ps.getPeekIndex());
    assert.strictEqual(1, ps.getIndex());

    assert.strictEqual('c', ps.peek());
    assert.strictEqual('b', ps.current());
    assert.strictEqual('c', ps.currentPeek());
    assert.strictEqual(2, ps.getPeekIndex());
    assert.strictEqual(1, ps.getIndex());

    assert.strictEqual('d', ps.peek());
    assert.strictEqual(undefined, ps.peek());
  });

  it('peek_char_is', function() {
    let ps = new ParserStream("abcd");

    ps.next();
    ps.peek();

    assert.strictEqual(true, ps.peekCharIs('d'));

    assert.strictEqual('b', ps.current());
    assert.strictEqual('c', ps.currentPeek());

    ps.skipToPeek();

    assert.strictEqual('c', ps.current());
  });
});
