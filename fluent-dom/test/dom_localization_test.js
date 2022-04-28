import assert from "assert";
import sinon from "sinon";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import DOMLocalization from "../esm/dom_localization.js";

async function* mockGenerateMessages(resourceIds) {
  const bundle = new FluentBundle(["en-US"]);
  const resource = new FluentResource("key1 = Key 1");
  bundle.addResource(resource);
  yield bundle;
}

suite("translateFragment", function () {
  setup(() => sinon.stub(console, "warn"));
  teardown(() => console.warn.restore());

  test("translates a node", async function () {
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);

    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "key1");
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);

    assert.strictEqual(elem.textContent, "Key 1");
  });

  test("does not inject content into a node with missing translation", async function () {
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);

    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "missing_key");
    elem.textContent = "Original Value";
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);

    assert.strictEqual(elem.textContent, "Original Value");
  });
});
