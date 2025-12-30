import assert from "assert";
import sinon from "sinon";
import translateElement from "../src/overlay.js";
import { elem } from "./util.js";

suite("Localized text markup", function () {
  beforeEach(() => sinon.stub(console, "warn"));
  afterEach(() => console.warn.restore());

  test("allowed element", function () {
    const element = elem("div")`Foo`;
    const translation = {
      value: "FOO <em>BAR</em> BAZ",
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, "FOO <em>BAR</em> BAZ");
  });

  test("forbidden element", function () {
    const element = elem("div")`Foo`;
    const translation = {
      value: 'FOO <img src="img.png" />',
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, "FOO ");
  });

  test("forbidden element with text", function () {
    const element = elem("div")`Foo`;
    const translation = {
      value: "FOO <button>BUTTON</button>",
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, "FOO BUTTON");
  });

  test("nested HTML is forbidden", function () {
    const element = elem("div")`Foo`;
    const translation = {
      value: "FOO <em><strong>BAR</strong></em> BAZ",
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, "FOO <em>BAR</em> BAZ");
  });
});

suite("Attributes of localized text markup", function () {
  test("allowed attribute", function () {
    const element = elem("div")`Foo Bar`;
    const translation = {
      value: 'FOO <em title="BAR">BAR</em>',
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, 'FOO <em title="BAR">BAR</em>');
  });

  test("forbidden attribute", function () {
    const element = elem("div")`Foo Bar`;
    const translation = {
      value: 'FOO <em class="BAR" title="BAR">BAR</em>',
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, 'FOO <em title="BAR">BAR</em>');
  });

  test("attributes do not leak on first translation", function () {
    const element = elem("div")`
      <em title="Foo">Foo</a>`;
    const translation = {
      value: "<em>FOO</em>",
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML, "<em>FOO</em>");
  });

  test("attributes do not leak on retranslation", function () {
    const element = elem("div")``;
    const translationA = {
      value: '<em title="FOO A">FOO A</em>',
      attributes: null,
    };
    const translationB = {
      value: "<em>FOO B</em>",
      attributes: null,
    };

    translateElement(element, translationA);
    assert.strictEqual(element.innerHTML, '<em title="FOO A">FOO A</em>');
    translateElement(element, translationB);
    assert.strictEqual(element.innerHTML, "<em>FOO B</em>");
  });
});
