import assert from "assert";
import ftl from "@fluent/dedent";

import * as AST from "../src/ast.ts";
import { FluentParser } from "../src/parser.ts";
import { FluentSerializer } from "../src/serializer.ts";

suite("Parse entry", function () {
  let parser;
  beforeEach(function () {
    parser = new FluentParser({ withSpans: false });
  });

  test("simple message", function () {
    const input = ftl`
      foo = Foo
      `;
    const output = {
      comment: null,
      value: {
        elements: [
          {
            type: "TextElement",
            value: "Foo",
          },
        ],
        type: "Pattern",
      },
      attributes: [],
      type: "Message",
      id: {
        type: "Identifier",
        name: "foo",
      },
    };

    const message = parser.parseEntry(input);
    assert.deepEqual(message, output);
  });

  test("ignore attached comment", function () {
    const input = ftl`
      # Attached Comment
      foo = Foo
      `;
    const output = {
      comment: null,
      value: {
        elements: [
          {
            type: "TextElement",
            value: "Foo",
          },
        ],
        type: "Pattern",
      },
      attributes: [],
      type: "Message",
      id: {
        type: "Identifier",
        name: "foo",
      },
    };

    const message = parser.parseEntry(input);
    assert.deepEqual(message, output);
  });

  test("return junk", function () {
    const input = ftl`
      # Attached Comment
      junk
      `;
    const output = {
      content: "junk",
      annotations: [
        {
          arguments: ["="],
          code: "E0003",
          message: 'Expected token: "="',
          span: {
            end: 23,
            start: 23,
            type: "Span",
          },
          type: "Annotation",
        },
      ],
      type: "Junk",
    };

    const message = parser.parseEntry(input);
    assert.deepEqual(message, output);
  });

  test("ignore all valid comments", function () {
    const input = ftl`
      # Attached Comment
      ## Group Comment
      ### Resource Comment
      foo = Foo
      `;
    const output = {
      comment: null,
      value: {
        elements: [
          {
            type: "TextElement",
            value: "Foo",
          },
        ],
        type: "Pattern",
      },
      attributes: [],
      type: "Message",
      id: {
        type: "Identifier",
        name: "foo",
      },
    };

    const message = parser.parseEntry(input);
    assert.deepEqual(message, output);
  });

  test("do not ignore invalid comments", function () {
    const input = ftl`
      # Attached Comment
      ##Invalid Comment
      `;
    const output = {
      content: "##Invalid Comment",
      annotations: [
        {
          arguments: [" "],
          code: "E0003",
          message: 'Expected token: " "',
          span: {
            end: 21,
            start: 21,
            type: "Span",
          },
          type: "Annotation",
        },
      ],
      type: "Junk",
    };

    const message = parser.parseEntry(input);
    assert.deepEqual(message, output);
  });
});

suite("Serialize entry", function () {
  test("simple message", function () {
    const input = new AST.Message(
      new AST.Identifier("foo"),
      new AST.Pattern([new AST.TextElement("Foo")])
    );
    const output = ftl`
      foo = Foo

      `;

    const message = new FluentSerializer().serializeEntry(input);
    assert.deepEqual(message, output);
  });
});
