import assert from "assert";
import { MessageContext } from "../../fluent/src/index";
import DOMLocalization from "../src/dom_localization";

function* mockGenerateMessages(resourceIds) {
  const mc = new MessageContext(["en-US"]);
  mc.addMessages("key1 = Key 1");
  yield mc;
}

const mockWindow = {
  MutationObserver: class MutationObserver {
    takeRecords() {return new Set();}
    disconnect() {}
  }
};

suite("translateFragment", function() {
  test("translates a node", async function() {
    const domLoc = new DOMLocalization(mockWindow, ["test.ftl"], mockGenerateMessages);

    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "key1");
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);

    assert.equal(elem.textContent, "Key 1");
  });

  test("does not inject content into a node with missing translation", async function() {
    const domLoc = new DOMLocalization(mockWindow, ["test.ftl"], mockGenerateMessages);

    const frag = document.createDocumentFragment();
    const elem = document.createElement("p");
    domLoc.setAttributes(elem, "missing_key");
    elem.textContent = "Original Value";
    frag.appendChild(elem);

    await domLoc.translateFragment(frag);

    assert.equal(elem.textContent, "Original Value");
  });

});
