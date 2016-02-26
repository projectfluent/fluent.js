'use strict';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';


var parse = FTLParser.parseResource;

describe('FTL Parser', function() {
  describe('Simple strings', function() {
    it('simple single line string', function() {
      var resource = parse('label-ok = Click me');
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Click me');
      assert.strictEqual(resource.body[0].value.content[0], 'Click me');
    });

    it('simple multi line string', function() {
      var resource = parse(
`label-ok = Click me
  | One more time`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Click me\nOne more time');
      assert.strictEqual(resource.body[0].value.content[0], 'Click me\nOne more time');
    });

    it('simple multi line string with empty line', function() {
      var resource = parse(
`label-ok =
  | Hello World
  | One more time`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Hello World\nOne more time');
      assert.strictEqual(resource.body[0].value.content[0], 'Hello World\nOne more time');
    });
  });

  describe('Members', function() {
    it('simple member', function() {
      var resource = parse(
`label-ok =
   [nominative] Firefox`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value, null);
      assert.strictEqual(resource.body[0].members[0].id.name, 'nominative');
      assert.strictEqual(resource.body[0].members[0].value.source, 'Firefox');
    });

    it('simple member with value', function() {
      var resource = parse(
`label-ok = This is a value
   [nominative] Firefox`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'This is a value');
      assert.strictEqual(resource.body[0].members[0].id.name, 'nominative');
      assert.strictEqual(resource.body[0].members[0].value.source, 'Firefox');
    });
  });
});
