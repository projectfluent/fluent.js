import assert from "assert";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { DOMLocalization } from "../src/dom_localization.ts";
import { vi } from "vitest";

async function* mockGenerateMessages() {
  const bundle = new FluentBundle(["en-US"]);
  const resource = new FluentResource("key1 = Key 1\nkey2 = Key {$arg}\n");
  bundle.addResource(resource);
  yield bundle;
}

suite("translateFragment", function () {
  test("translates a node", async function () {
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);

    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "key1");
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);

    assert.strictEqual(elem.textContent, "Key 1");
  });

  test("translates a node with arguments", async function () {
    const FSI = "\u2068";
    const PDI = "\u2069";
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);

    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "key2", { arg: 42 });
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);
    assert.strictEqual(elem.textContent, `Key ${FSI}42${PDI}`);

    domLoc.setArgs(elem, { arg: 99 });
    await domLoc.translateFragment(frag);
    assert.strictEqual(elem.textContent, `Key ${FSI}99${PDI}`);
  });

  test("does not inject content into a node with missing translation", async function () {
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);

    vi.spyOn(console, "warn").mockImplementation(() => {});
    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "missing_key");
    elem.textContent = "Original Value";
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);

    assert.strictEqual(elem.textContent, "Original Value");
  });
});
