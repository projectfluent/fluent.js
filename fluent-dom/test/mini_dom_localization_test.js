import assert from "assert";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import MiniDOMLocalization from "../src/mini_dom_localization.js";
import { beforeEach, vi } from "vitest";

let translation = "Key 1";

async function* mockGenerateMessages() {
  const bundle = new FluentBundle(["en-US"]);
  const resource = new FluentResource(`key1 = ${translation}`);
  bundle.addResource(resource);
  yield bundle;
}

function createTranslatable(id) {
  const elem = document.createElement("p");
  elem.setAttribute("data-l10n-id", id);
  return elem;
}

suite("MiniDOMLocalization", function () {
  beforeEach(function () {
    translation = "Key 1";
  });

  suite("translateFragment", function () {
    test("translates a node", async function () {
      const l10n = new MiniDOMLocalization(["test.ftl"], mockGenerateMessages);

      const frag = document.createDocumentFragment();
      const elem = createTranslatable("key1");
      frag.appendChild(elem);

      await l10n.translateFragment(frag);

      assert.strictEqual(elem.textContent, "Key 1");
    });

    test("translates the fragment itself when it is an element", async function () {
      const l10n = new MiniDOMLocalization(["test.ftl"], mockGenerateMessages);

      const elem = createTranslatable("key1");

      await l10n.translateFragment(elem);

      assert.strictEqual(elem.textContent, "Key 1");
    });

    test("does not inject content into a node with missing translation", async function () {
      const l10n = new MiniDOMLocalization(["test.ftl"], mockGenerateMessages);

      vi.spyOn(console, "warn").mockImplementation(() => {});
      const frag = document.createDocumentFragment();
      const elem = createTranslatable("missing_key");
      elem.textContent = "Original Value";
      frag.appendChild(elem);

      await l10n.translateFragment(frag);

      assert.strictEqual(elem.textContent, "Original Value");
    });
  });

  suite("connectRoot", function () {
    test("retranslates connected roots on language change", async function () {
      const l10n = new MiniDOMLocalization(["test.ftl"], mockGenerateMessages);
      const root = document.createElement("div");
      const elem = createTranslatable("key1");
      root.appendChild(elem);

      l10n.connectRoot(root);
      await l10n.translateRoots();
      assert.strictEqual(elem.textContent, "Key 1");

      translation = "Clé 1";
      l10n.onChange();
      // Wait for the pending translation to be applied.
      await l10n.formatMessages([]);
      assert.strictEqual(elem.textContent, "Clé 1");
    });

    test("disconnectRoot reports whether the last root was removed", function () {
      const l10n = new MiniDOMLocalization(["test.ftl"], mockGenerateMessages);
      const root1 = document.createElement("div");
      const root2 = document.createElement("div");

      l10n.connectRoot(root1);
      l10n.connectRoot(root2);

      assert.strictEqual(l10n.disconnectRoot(root1), false);
      assert.strictEqual(l10n.disconnectRoot(root2), true);
    });
  });
});
