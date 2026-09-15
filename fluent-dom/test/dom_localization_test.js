import assert from "assert";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import DOMLocalization from "../src/dom_localization.js";
import { vi } from "vitest";

async function* mockGenerateMessages() {
  const bundle = new FluentBundle(["en-US"]);
  const resource = new FluentResource("key1 = Key 1");
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

suite("connectRoot", function () {
  // Wait for the MutationObserver callback and the requestAnimationFrame
  // handler scheduled by `translateMutations`, then for the translation to
  // be applied.
  async function waitForMutationTranslation(domLoc) {
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => requestAnimationFrame(resolve));
    await domLoc.formatMessages([]);
  }

  test("translates mutations by default", async function () {
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);
    const root = document.createElement("div");
    document.body.appendChild(root);

    domLoc.connectRoot(root);
    assert.ok(domLoc.rootsUsingObserver.has(root));

    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "key1");
    root.appendChild(elem);

    await waitForMutationTranslation(domLoc);
    assert.strictEqual(elem.textContent, "Key 1");

    domLoc.disconnectRoot(root);
    root.remove();
  });

  test("does not translate mutations when useObserver is false", async function () {
    const domLoc = new DOMLocalization(["test.ftl"], mockGenerateMessages);
    const root = document.createElement("div");
    document.body.appendChild(root);

    domLoc.connectRoot(root, { useObserver: false });
    assert.ok(domLoc.roots.has(root));
    assert.ok(!domLoc.rootsUsingObserver.has(root));

    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "key1");
    root.appendChild(elem);

    await waitForMutationTranslation(domLoc);
    assert.strictEqual(elem.textContent, "");

    // The root is still managed and can be translated explicitly.
    await domLoc.translateRoots();
    assert.strictEqual(elem.textContent, "Key 1");

    assert.strictEqual(domLoc.disconnectRoot(root), true);
    root.remove();
  });
});
