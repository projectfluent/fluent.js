"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";
import * as AST from "../esm/ast.js";
import { FluentParser } from "../esm/parser.js";

suite("BaseNode.equals", function () {
  setup(function () {
    this.parser = new FluentParser();
  });
  test("Identifier.equals", function () {
    const thisNode = new AST.Identifier("name");
    const otherNode = new AST.Identifier("name");
    assert.ok(thisNode.clone() instanceof AST.Identifier);
    assert.strictEqual(thisNode.equals(otherNode), true);
    assert.strictEqual(thisNode.equals(thisNode.clone()), true);
    assert.notStrictEqual(thisNode, thisNode.clone());
  });
  test("Node.type", function () {
    const thisNode = new AST.Identifier("name");
    const otherNode = new AST.StringLiteral("name");
    assert.strictEqual(thisNode.equals(otherNode), false);
  });
  test("Array children", function () {
    const thisNode = new AST.Pattern([
      new AST.TextElement("one"),
      new AST.TextElement("two"),
      new AST.TextElement("three"),
    ]);
    let otherNode = new AST.Pattern([
      new AST.TextElement("one"),
      new AST.TextElement("two"),
      new AST.TextElement("three"),
    ]);
    assert.strictEqual(thisNode.equals(otherNode), true);
  });
  test("Variant order matters", function () {
    const thisRes = this.parser.parse(ftl`
          msg = { $val ->
              [few] things
              [1] one
             *[other] default
            }
          `);
    const otherRes = this.parser.parse(ftl`
          msg = { $val ->
              [few] things
             *[other] default
              [1] one
            }
          `);
    const thisNode = thisRes.body[0];
    const otherNode = otherRes.body[0];
    assert.strictEqual(thisNode.equals(otherNode), false);
    assert.strictEqual(thisRes.equals(thisRes.clone(), []), true);
    assert.notStrictEqual(thisRes, thisRes.clone());
  });
  test("Attribute order matters", function () {
    const thisRes = this.parser.parse(ftl`
          msg =
            .attr1 = one
            .attr2 = two
          `);
    const otherRes = this.parser.parse(ftl`
          msg =
            .attr2 = two
            .attr1 = one
          `);
    const thisNode = thisRes.body[0];
    const otherNode = otherRes.body[0];
    assert.strictEqual(thisNode.equals(otherNode), false);
  });
});
