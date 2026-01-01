import { FluentBundle, FluentResource } from "@fluent/bundle";
import { afterEach, beforeAll, expect, vi } from "vitest";
import { Localization } from "../src/localization.ts";

async function* mockGenerateMessages() {
  const bundle = new FluentBundle(["en-US"]);
  const resource = new FluentResource("key1 = Key 1");
  bundle.addResource(resource);
  yield bundle;
}

beforeAll(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
afterEach(vi.clearAllMocks);

for (const [name, keys] of [
  ["string keys", ["missing_key", "key1"]],
  ["object keys", [{ id: "missing_key" }, { id: "key1" }]],
]) {
  suite(name, () => {
    test("formatMessages", async function () {
      const loc = new Localization(["test.ftl"], mockGenerateMessages);
      const translations = await loc.formatMessages(keys);

      expect(translations).toEqual([
        undefined,
        { value: "Key 1", attributes: null },
      ]);
      expect(console.warn.mock.calls).toEqual([
        ["[fluent] Missing translations in en-US: missing_key"],
      ]);
    });

    test("formatValues", async function () {
      const loc = new Localization(["test.ftl"], mockGenerateMessages);
      const translations = await loc.formatValues(keys);

      expect(translations).toEqual([undefined, "Key 1"]);
      expect(console.warn.mock.calls).toEqual([
        ["[fluent] Missing translations in en-US: missing_key"],
      ]);
    });
  });
}
