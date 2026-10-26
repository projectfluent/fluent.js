import assert from "assert";
import { columnOffset, lineOffset } from "../src/index.ts";

suite("columnOffset", function () {
  test("file start before a leading LF", function () {
    const source = "\nhello = Hello";
    assert.strictEqual(lineOffset(source, 0), 0);
    assert.strictEqual(columnOffset(source, 0), 0);
  });

  test("file start in an LF-only source", function () {
    assert.strictEqual(columnOffset("\n", 0), 0);
  });

  test("file start in an empty source", function () {
    assert.strictEqual(columnOffset("", 0), 0);
  });

  test("file start in a nonempty first line", function () {
    assert.strictEqual(columnOffset("hello", 0), 0);
  });

  test("file start before CRLF", function () {
    assert.strictEqual(columnOffset("\r\nhello", 0), 0);
  });

  test("position on a line break", function () {
    assert.strictEqual(columnOffset("hello\nworld", 5), 5);
  });

  test("position immediately after a line break", function () {
    assert.strictEqual(columnOffset("hello\nworld", 6), 0);
  });

  test("position between consecutive line breaks", function () {
    assert.strictEqual(columnOffset("\n\nhello", 1), 0);
  });

  test("end of the last line", function () {
    assert.strictEqual(columnOffset("hello\nworld", 11), 5);
  });
});
