import assert from "assert";
import { FluentBundle } from "../../fluent/src/index";
import Localization from "../src/localization";

async function* mockGenerateMessages(resourceIds) {
  const bundle = new FluentBundle(["en-US"]);
  bundle.addMessages("key1 = Key 1");
  yield bundle;
}

suite("formatMessages", function() {
  test("returns a translation", async function() {
    const loc = new Localization(["test.ftl"], mockGenerateMessages);
    const translations = await loc.formatMessages([{id: "key1"}]);

    assert.equal(translations[0].value, "Key 1");
  });

  test("returns undefined for a missing translation", async function() {
    const loc = new Localization(["test.ftl"], mockGenerateMessages);
    const translations = await loc.formatMessages([{id: "missing_key"}]);

    // Make sure that the returned value here is `undefined`.
    // This allows bindings to handle missing translations.
    assert.equal(translations[1], undefined);
  });
});
