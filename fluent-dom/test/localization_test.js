import assert from "assert";
import { MessageContext } from "../../fluent/src/index";
import Localization from "../src/localization";

async function* mockGenerateMessages(resourceIds) {
  const mc = new MessageContext(["en-US"]);
  mc.addMessages("key1 = Key 1");
  yield mc;
}

suite("formatMessages", function() {
  test("returns a translation", async function() {
    const loc = new Localization(["test.ftl"], mockGenerateMessages);
    const translations = await loc.formatMessages([["key1"]]);

    assert.equal(translations[0].value, "Key 1");
  });

  test("returns undefined for a missing translation", async function() {
    const loc = new Localization(["test.ftl"], mockGenerateMessages);
    const translations = await loc.formatMessages([["missing_key"]]);

    // Make sure that the returned value here is `undefined`.
    // This allows bindings to handle missing translations.
    assert.equal(translations[1], undefined);
  });
});
