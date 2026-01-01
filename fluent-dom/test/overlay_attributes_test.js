import assert from "assert";
import translateElement from "../esm/overlay.js";
import { elem } from "./util.js";

suite("Top-level attributes", function () {
  test("allowed attribute", function () {
    const element = elem("div")``;
    const translation = {
      value: null,
      attributes: [{ name: "title", value: "FOO" }],
    };

    translateElement(element, translation);
    assert.strictEqual(element.outerHTML, '<div title="FOO"></div>');
  });

  test("forbidden attribute", function () {
    const element = elem("input")``;
    const translation = {
      value: null,
      attributes: [{ name: "disabled", value: "DISABLED" }],
    };

    translateElement(element, translation);
    assert.strictEqual(element.outerHTML, "<input>");
  });

  test("attributes do not leak on first translation", function () {
    const element = elem("div")`Foo`;
    element.setAttribute("title", "Title");

    const translation = {
      value: "FOO",
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.outerHTML, "<div>FOO</div>");
  });

  test("attributes do not leak on retranslation", function () {
    const element = elem("div")`Foo`;
    const translationA = {
      value: "FOO A",
      attributes: [{ name: "title", value: "TITLE A" }],
    };
    const translationB = {
      value: "FOO B",
      attributes: null,
    };

    translateElement(element, translationA);
    assert.strictEqual(element.outerHTML, '<div title="TITLE A">FOO A</div>');
    translateElement(element, translationB);
    assert.strictEqual(element.outerHTML, "<div>FOO B</div>");
  });
});
