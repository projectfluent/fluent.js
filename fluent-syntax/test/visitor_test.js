"use strict";

import assert from "assert";
import { ftl } from "./util";
import { FluentParser, Visitor, Transformer } from "../src";

suite("Visitor", function() {
  setup(function() {
    const parser = new FluentParser();
    this.resource = parser.parse(ftl`
        one = Message
        # Comment
        two = Messages
        three = Messages with
            .an = Attribute
    `);
  });
  test("Mock Visitor", function() {
    class MockVisitor extends Visitor {
      constructor() {
        super();
        this.calls = {};
        this.pattern_calls = 0;
      }
      genericVisit(node) {
        const nodename = node.type;
        if (nodename in this.calls) {
          this.calls[nodename]++;
        } else {
          this.calls[nodename] = 1;
        }
        super.genericVisit(node);
      }
      visitPattern(node) {
        this.pattern_calls++;
      }
    }
    const mv = new MockVisitor();
    mv.visit(this.resource);
    assert.strictEqual(mv.pattern_calls, 4);
    assert.deepStrictEqual(
      mv.calls,
      {
        'Resource': 1,
        'Comment': 1,
        'Message': 3,
        'Identifier': 4,
        'Attribute': 1,
        'Span': 10,
      }
    )
  });
  test("WordCount", function() {
    class VisitorCounter extends Visitor {
      constructor() {
        super();
        this.word_count = 0;
      }
      genericVisit(node) {
        switch (node.type) {
          case 'Span':
          case 'Annotation':            
            break;
          default:
            super.genericVisit(node);
        }
      }
      visitTextElement(node) {
        this.word_count += node.value.split(/\s+/).length;
      }
    }
    const vc = new VisitorCounter();
    vc.visit(this.resource);
    assert.strictEqual(vc.word_count, 5);
  })
});

suite("Transformer", function() {
  setup(function() {
    const parser = new FluentParser();
    this.resource = parser.parse(ftl`
        one = Message
        # Comment
        two = Messages
        three = Messages with
            .an = Attribute
    `);
  });
  test("ReplaceTransformer", function() {
    class ReplaceTransformer extends Transformer {
      constructor(before, after) {
        super();
        this.before = before;
        this.after = after;
      }
      genericVisit(node) {
        switch (node.type) {
          case 'Span':
          case 'Annotation':
            return node;
            break;
          default:
            return super.genericVisit(node);
        }
      }
      visitTextElement(node) {
        node.value = node.value.replace(this.before, this.after);
        return node;
      }
    }
    const resource = this.resource.clone()
    const transformed = new ReplaceTransformer('Message', 'Term').visit(resource);
    assert.notStrictEqual(resource, this.resource);
    assert.strictEqual(resource, transformed);
    assert.strictEqual(this.resource.equals(transformed), false);
    assert.strictEqual(transformed.body[1].value.elements[0].value, 'Terms');
  });
});
