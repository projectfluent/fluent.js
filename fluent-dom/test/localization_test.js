import assert from "assert";
import sinon from "sinon";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import Localization from "../esm/localization.js";

async function* mockGenerateMessages() {
  const bundle = new FluentBundle(["en-US"]);
  const resource = new FluentResource("key1 = Key 1");
  bundle.addResource(resource);
  yield bundle;
}

suite("formatMessages", function () {
  setup(() => sinon.stub(console, "warn"));
  teardown(() => console.warn.restore());

  test("returns a translation", async function () {
    const loc = new Localization(["test.ftl"], mockGenerateMessages);
    const translations = await loc.formatMessages([{ id: "key1" }]);

    assert.strictEqual(translations[0].value, "Key 1");
  });

  test("returns undefined for a missing translation", async function () {
    const loc = new Localization(["test.ftl"], mockGenerateMessages);
    const translations = await loc.formatMessages([{ id: "missing_key" }]);

    // Make sure that the returned value here is `undefined`.
    // This allows bindings to handle missing translations.
    assert.strictEqual(translations[1], undefined);
  });
});
