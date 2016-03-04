'use strict';

import assert from 'assert';
import FTLParser from '../../../../src/lib/format/ftl/ast/parser';


var parse = FTLParser.parseResource;

describe('FTL Parser', function() {
  describe('Simple strings', function() {
    it('simple single line string', function() {
      var resource = parse('label-ok = Click me');
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Click me');
      assert.strictEqual(resource.body[0].value.elements[0].value, 'Click me');
    });

    it('simple multi line string', function() {
      var resource = parse(
`label-ok = Click me
  | One more time`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Click me\nOne more time');
      assert.strictEqual(resource.body[0].value.elements[0].value, 'Click me\nOne more time');
    });

    it('simple multi line string with no space', function() {
      var resource = parse(
`label-ok = Click me
  |One more time`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Click me\nOne more time');
      assert.strictEqual(resource.body[0].value.elements[0].value, 'Click me\nOne more time');
    });

    it('simple multi line string with empty line', function() {
      var resource = parse(
`label-ok =
  | Hello World
  | One more time`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'Hello World\nOne more time');
      assert.strictEqual(resource.body[0].value.elements[0].value, 'Hello World\nOne more time');
    });
  });

  describe('Members', function() {
    it('simple member', function() {
      var resource = parse(
`label-ok =
   [nominative] Firefox`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, '');
      assert.strictEqual(resource.body[0].traits[0].key, 'nominative');
      assert.strictEqual(resource.body[0].traits[0].value.source, 'Firefox');
    });

    it('simple member with value', function() {
      var resource = parse(
`label-ok = This is a value
   [nominative] Firefox`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'This is a value');
      assert.strictEqual(resource.body[0].traits[0].id.name, 'nominative');
      assert.strictEqual(resource.body[0].traits[0].value.source, 'Firefox');
    });

    it('multi line traits', function() {
      var resource = parse(
`label-ok =
   [nominative]
      | First case
      | of multiline
   [locative]
      | Second case
      | of multiline`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value, null);
      assert.strictEqual(resource.body[0].traits[0].id.name, 'nominative');
      assert.strictEqual(resource.body[0].traits[0].value.source, 'First case\nof multiline');
      assert.strictEqual(resource.body[0].traits[1].id.name, 'locative');
      assert.strictEqual(resource.body[0].traits[1].value.source, 'Second case\nof multiline');
    });
  });

  describe('Placeables', function() {
    it('simple entity reference', function() {
      var resource = parse(
`label-ok = { brand-name }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, '{ brand-name }');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.name, 'brand-name');
    });

    it('simple variable', function() {
      var resource = parse(
`label-ok = { $num }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, '{ $num }');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.id.name, 'num');
    });

    it('variants', function() {
      var resource = parse(
`label-ok = {
  [nominative] Firefox
  [locative]  Firefoksa
}`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.variants.length, 2);
    });

    it('variants with default', function() {
      var resource = parse(
`label-ok = {
  [nominative] Firefox
 *[locative]  Firefoksa
}`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.variants.length, 2);
      assert.strictEqual(resource.body[0].value.content[0].content.variants[1].default, true);
    });

    it('variants with selector', function() {
      var resource = parse(
`label-ok = { gender ->
  [nominative] Firefox
 *[locative]  Firefoksa
}`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.selector.name, 'gender');
      assert.strictEqual(resource.body[0].value.content[0].content.variants.length, 2);
      assert.strictEqual(resource.body[0].value.content[0].content.variants[1].default, true);
    });

    it('nested variants with selector', function() {
      var resource = parse(
`label-ok = { gender ->
  [nominative] Firefox { brand-name ->
    [male] Male
    [female] Female
  }
 *[locative]  Firefoksa
}`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.selector.name, 'gender');
      assert.strictEqual(resource.body[0].value.content[0].content.variants.length, 2);
      assert.strictEqual(resource.body[0].value.content[0].content.variants[0].value.content[1].content.selector.name, 'brand-name');
      assert.strictEqual(resource.body[0].value.content[0].content.variants[0].value.content[1].content.variants[1].value.source, 'Female');
      assert.strictEqual(resource.body[0].value.content[0].content.variants[1].default, true);
    });

    it('member expression', function() {
      var resource = parse(`label-ok = { brand-name[locative] }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.idref.name, 'brand-name');
      assert.strictEqual(resource.body[0].value.content[0].content.keyword.name, 'locative');
    });

    it('call expression', function() {
      var resource = parse(`label-ok = { len($num) }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.callee.name, 'len');
      assert.strictEqual(resource.body[0].value.content[0].content.args[0].id.name, 'num');
    });

    it('call expression with two args', function() {
      var resource = parse(`label-ok = { len($num, $val) }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.callee.name, 'len');
      assert.strictEqual(resource.body[0].value.content[0].content.args[0].id.name, 'num');
      assert.strictEqual(resource.body[0].value.content[0].content.args[1].id.name, 'val');
    });

    it('call expression with kwarg', function() {
      var resource = parse(`label-ok = { len(style="short") }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.callee.name, 'len');
      assert.strictEqual(resource.body[0].value.content[0].content.args[0].key.name, 'style');
      assert.strictEqual(resource.body[0].value.content[0].content.args[0].value.source, 'short');
    });

    it('call expression with two kwargs', function() {
      var resource = parse(`label-ok = { len(style="short", variant="digit") }`);
      assert.strictEqual(resource.body[0].id.name, 'label-ok');
      assert.strictEqual(resource.body[0].value.content[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.content[0].content.callee.name, 'len');
      assert.strictEqual(resource.body[0].value.content[0].content.args[0].key.name, 'style');
      assert.strictEqual(resource.body[0].value.content[0].content.args[1].key.name, 'variant');
    });
  });
});
