import assert from "assert";
import translateElement from "../src/overlay.ts";
import { elem } from "./util.js";

suite("Applying translations", function () {
  test("Skipping sanitization for the title element", function () {
    const element = elem("title")``;
    const translation = {
      value: '<input type="text"/> - HTML: Input Element',
      attributes: null,
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '&lt;input type="text"/&gt; - HTML: Input Element'
    );
  });
});
