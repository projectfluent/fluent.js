"use strict";

import assert from "assert";
import { ParserStream } from "../esm/stream.js";

suite("ParserStream", function () {
  test("next", function () {
    let ps = new ParserStream("abcd");

    assert.strictEqual("a", ps.currentChar());
    assert.strictEqual(0, ps.index);

    assert.strictEqual("b", ps.next());
    assert.strictEqual("b", ps.currentChar());
    assert.strictEqual(1, ps.index);

    assert.strictEqual("c", ps.next());
    assert.strictEqual("c", ps.currentChar());
    assert.strictEqual(2, ps.index);

    assert.strictEqual("d", ps.next());
    assert.strictEqual("d", ps.currentChar());
    assert.strictEqual(3, ps.index);

    assert.strictEqual(undefined, ps.next());
    assert.strictEqual(undefined, ps.currentChar());
    assert.strictEqual(4, ps.index);
  });

  test("peek", function () {
    let ps = new ParserStream("abcd");

    assert.strictEqual("a", ps.currentPeek());
    assert.strictEqual(0, ps.peekOffset);

    assert.strictEqual("b", ps.peek());
    assert.strictEqual("b", ps.currentPeek());
    assert.strictEqual(1, ps.peekOffset);

    assert.strictEqual("c", ps.peek());
    assert.strictEqual("c", ps.currentPeek());
    assert.strictEqual(2, ps.peekOffset);

    assert.strictEqual("d", ps.peek());
    assert.strictEqual("d", ps.currentPeek());
    assert.strictEqual(3, ps.peekOffset);

    assert.strictEqual(undefined, ps.peek());
    assert.strictEqual(undefined, ps.currentPeek());
    assert.strictEqual(4, ps.peekOffset);
  });

  test("peek_and_next", function () {
    let ps = new ParserStream("abcd");

    assert.strictEqual("b", ps.peek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(0, ps.index);

    assert.strictEqual("b", ps.next());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(1, ps.index);

    assert.strictEqual("c", ps.peek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(1, ps.index);

    assert.strictEqual("c", ps.next());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(2, ps.index);
    assert.strictEqual("c", ps.currentChar());
    assert.strictEqual("c", ps.currentPeek());

    assert.strictEqual("d", ps.peek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(2, ps.index);

    assert.strictEqual("d", ps.next());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(3, ps.index);
    assert.strictEqual("d", ps.currentChar());
    assert.strictEqual("d", ps.currentPeek());

    assert.strictEqual(undefined, ps.peek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(3, ps.index);
    assert.strictEqual("d", ps.currentChar());
    assert.strictEqual(undefined, ps.currentPeek());

    assert.strictEqual(undefined, ps.peek());
    assert.strictEqual(2, ps.peekOffset);
    assert.strictEqual(3, ps.index);

    assert.strictEqual(undefined, ps.next());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(4, ps.index);
  });

  test("skip_to_peek", function () {
    let ps = new ParserStream("abcd");

    ps.peek();
    ps.peek();

    ps.skipToPeek();

    assert.strictEqual("c", ps.currentChar());
    assert.strictEqual("c", ps.currentPeek());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(2, ps.index);

    ps.peek();

    assert.strictEqual("c", ps.currentChar());
    assert.strictEqual("d", ps.currentPeek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(2, ps.index);

    ps.next();

    assert.strictEqual("d", ps.currentChar());
    assert.strictEqual("d", ps.currentPeek());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(3, ps.index);
  });

  test("reset_peek", function () {
    let ps = new ParserStream("abcd");

    ps.next();
    ps.peek();
    ps.peek();
    ps.resetPeek();

    assert.strictEqual("b", ps.currentChar());
    assert.strictEqual("b", ps.currentPeek());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(1, ps.index);

    ps.peek();

    assert.strictEqual("b", ps.currentChar());
    assert.strictEqual("c", ps.currentPeek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(1, ps.index);

    ps.peek();
    ps.peek();
    ps.peek();
    ps.resetPeek();

    assert.strictEqual("b", ps.currentChar());
    assert.strictEqual("b", ps.currentPeek());
    assert.strictEqual(0, ps.peekOffset);
    assert.strictEqual(1, ps.index);

    assert.strictEqual("c", ps.peek());
    assert.strictEqual("b", ps.currentChar());
    assert.strictEqual("c", ps.currentPeek());
    assert.strictEqual(1, ps.peekOffset);
    assert.strictEqual(1, ps.index);

    assert.strictEqual("d", ps.peek());
    assert.strictEqual(undefined, ps.peek());
  });
});
