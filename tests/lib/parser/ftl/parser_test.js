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
      assert.strictEqual(resource.body[0].traits[0].key.value, 'nominative');
      assert.strictEqual(resource.body[0].traits[0].value.source, 'Firefox');
    });

    it('simple member with value', function() {
      var resource = parse(
`label-ok = This is a value
   [nominative] Firefox`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, 'This is a value');
      assert.strictEqual(resource.body[0].traits[0].key.value, 'nominative');
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
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, '');
      assert.strictEqual(resource.body[0].traits[0].key.value, 'nominative');
      assert.strictEqual(resource.body[0].traits[0].value.source, 'First case\nof multiline');
      assert.strictEqual(resource.body[0].traits[1].key.value, 'locative');
      assert.strictEqual(resource.body[0].traits[1].value.source, 'Second case\nof multiline');
    });
  });

  describe('Placeables', function() {
    it('simple entity reference', function() {
      var resource = parse(
`label-ok = { brand-name }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, '{ brand-name }');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.id, 'brand-name');
    });

    it('simple variable', function() {
      var resource = parse(
`label-ok = { $num }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.source, '{ $num }');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.id, 'num');
    });

    it('variants with selector', function() {
      var resource = parse(
`label-ok = { gender ->
  [nominative] Firefox
 *[locative]  Firefoksa
}`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');

      let exp = resource.body[0].value.elements[0].expressions[0];
      assert.strictEqual(exp.expression.id, 'gender');
      assert.strictEqual(exp.variants.length, 2);
      assert.strictEqual(exp.variants[1].default, true);
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
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');

      let exp = resource.body[0].value.elements[0].expressions[0];
      assert.strictEqual(exp.expression.id, 'gender');
      assert.strictEqual(exp.variants.length, 2);
      assert.strictEqual(exp.variants[0].value.elements[1].expressions[0].expression.id, 'brand-name');
      assert.strictEqual(exp.variants[0].value.elements[1].expressions[0].variants[1].value.source, 'Female');
      assert.strictEqual(exp.variants[1].default, true);
    });

    it('member expression', function() {
      var resource = parse(`label-ok = { brand-name[locative] }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.idref.id, 'brand-name');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.keyword.value, 'locative');
    });

    it('call expression', function() {
      var resource = parse(`label-ok = { len($num) }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.callee.id, 'len');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.args[0].id, 'num');
    });

    it('call expression with two args', function() {
      var resource = parse(`label-ok = { len($num, $val) }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.callee.id, 'len');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.args[0].id, 'num');
      assert.strictEqual(resource.body[0].value.elements[0].expressions[0].expression.args[1].id, 'val');
    });

    it('call expression with kwarg', function() {
      var resource = parse(`label-ok = { len(style="short") }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');

      let exp = resource.body[0].value.elements[0].expressions[0];
      assert.strictEqual(exp.expression.callee.id, 'len');
      assert.strictEqual(exp.expression.args[0].key, 'style');
      assert.strictEqual(exp.expression.args[0].value.source, 'short');
    });

    it('call expression with two kwargs', function() {
      var resource = parse(`label-ok = { len(style="short", variant="digit") }`);
      assert.strictEqual(resource.body[0].id, 'label-ok');
      assert.strictEqual(resource.body[0].value.elements[0].type, 'Placeable');

      let exp = resource.body[0].value.elements[0].expressions[0].expression;
      assert.strictEqual(exp.callee.id, 'len');
      assert.strictEqual(exp.args[0].key, 'style');
      assert.strictEqual(exp.args[1].key, 'variant');
    });
  });
});
