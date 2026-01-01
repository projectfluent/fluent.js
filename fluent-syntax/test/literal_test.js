import assert from "assert";
import { FluentParser } from "../src/parser.ts";

const parser = new FluentParser({ withSpans: false });
const parseLiteral = input => {
  let ast = parser.parseEntry(input);
  let expr = ast.value.elements[0].expression;
  return expr.parse();
};

suite("StringLiteral.parse()", function () {
  test("No escape sequences ", function () {
    assert.deepEqual(parseLiteral(`x = {"abc"}`), { value: "abc" });
  });

  test("Double quote and backslash", function () {
    assert.deepEqual(parseLiteral(`x = {"\\""}`), { value: '"' });
    assert.deepEqual(parseLiteral(`x = {"\\\\"}`), { value: "\\" });
  });

  test("Unicode escapes", function () {
    assert.deepEqual(parseLiteral(`x = {"\\u0041"}`), { value: "A" });
    assert.deepEqual(parseLiteral(`x = {"\\\\u0041"}`), { value: "\\u0041" });
    assert.deepEqual(parseLiteral(`x = {"\\U01F602"}`), { value: "😂" });
    assert.deepEqual(parseLiteral(`x = {"\\\\U01F602"}`), {
      value: "\\U01F602",
    });
  });

  test("Trailing 00 are not part of the literal value", function () {
    assert.deepEqual(parseLiteral(`x = {"\\u004100"}`), { value: "A00" });
    assert.deepEqual(parseLiteral(`x = {"\\U01F60200"}`), { value: "😂00" });
  });

  test("Literal braces", function () {
    assert.deepEqual(parseLiteral(`x = {"{"}`), { value: "{" });
    assert.deepEqual(parseLiteral(`x = {"}"}`), { value: "}" });
  });
});

suite("NumberLiteral.parse()", function () {
  test("No escape sequences ", function () {
    assert.deepEqual(parseLiteral(`x = {"abc"}`), { value: "abc" });
  });

  test("Integers", function () {
    assert.deepEqual(parseLiteral("x = {0}"), { value: 0, precision: 0 });
    assert.deepEqual(parseLiteral("x = {1}"), { value: 1, precision: 0 });
    assert.deepEqual(parseLiteral("x = {-1}"), { value: -1, precision: 0 });
    assert.deepEqual(parseLiteral("x = {-0}"), { value: 0, precision: 0 });
  });
  test("Padded integers", function () {
    assert.deepEqual(parseLiteral("x = {01}"), { value: 1, precision: 0 });
    assert.deepEqual(parseLiteral("x = {-01}"), { value: -1, precision: 0 });
    assert.deepEqual(parseLiteral("x = {00}"), { value: 0, precision: 0 });
    assert.deepEqual(parseLiteral("x = {-00}"), { value: 0, precision: 0 });
  });
  test("Positive floats", function () {
    assert.deepEqual(parseLiteral("x = {0.0}"), { value: 0, precision: 1 });
    assert.deepEqual(parseLiteral("x = {0.01}"), { value: 0.01, precision: 2 });
    assert.deepEqual(parseLiteral("x = {1.03}"), { value: 1.03, precision: 2 });
    assert.deepEqual(parseLiteral("x = {1.000}"), { value: 1, precision: 3 });
  });
  test("Negative floats", function () {
    assert.deepEqual(parseLiteral("x = {-0.01}"), {
      value: -0.01,
      precision: 2,
    });
    assert.deepEqual(parseLiteral("x = {-1.03}"), {
      value: -1.03,
      precision: 2,
    });
    assert.deepEqual(parseLiteral("x = {-0.0}"), { value: 0, precision: 1 });
    assert.deepEqual(parseLiteral("x = {-1.000}"), { value: -1, precision: 3 });
  });
  test("Padded floats", function () {
    assert.deepEqual(parseLiteral("x = {01.03}"), {
      value: 1.03,
      precision: 2,
    });
    assert.deepEqual(parseLiteral("x = {1.0300}"), {
      value: 1.03,
      precision: 4,
    });
    assert.deepEqual(parseLiteral("x = {01.0300}"), {
      value: 1.03,
      precision: 4,
    });
    assert.deepEqual(parseLiteral("x = {-01.03}"), {
      value: -1.03,
      precision: 2,
    });
    assert.deepEqual(parseLiteral("x = {-1.0300}"), {
      value: -1.03,
      precision: 4,
    });
    assert.deepEqual(parseLiteral("x = {-01.0300}"), {
      value: -1.03,
      precision: 4,
    });
  });
});
