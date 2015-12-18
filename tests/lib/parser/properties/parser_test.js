'use strict';

import assert from 'assert';
import PropertiesParser from '../../../../src/lib/format/properties/parser';

describe('L10n Parser', function() {

  it('string value', function() {
    var entries = PropertiesParser.parse(null, 'id = string');
    assert.strictEqual(entries.id, 'string');
  });

  it('empty value', function() {
    var entries = PropertiesParser.parse(null, 'id =');
    assert.equal(entries.id, '');
  });

  it('empty value with white spaces', function() {
    var entries = PropertiesParser.parse(null, 'id =  ');
    assert.equal(entries.id, '');
  });

  it('complex value', function() {
    var entries = PropertiesParser.parse(null, 'id = pre {{ foo }} post');
    assert.strictEqual(entries.id.value[0], 'pre ');
    assert.strictEqual(entries.id.value[1].name, 'foo');
    assert.strictEqual(entries.id.value[2], ' post');
  });


  it('basic errors', function() {
    var strings = [
      '',
      'id',
      'id ',
      '+id',
      '=id',
    ];

    for (var i in strings) {
      if (strings.hasOwnProperty(i)) {
        var entries = PropertiesParser.parse(null, strings[i]);
        assert.equal(Object.keys(entries).length, 0);
      }
    }
  });

  it('basic attributes', function() {
    var entries = PropertiesParser.parse(null, 'id.attr1 = foo');
    assert.equal(entries.id.attrs.attr1, 'foo');
  });

  it('empty attribute', function() {
    var entries = PropertiesParser.parse(null, 'id.attr1 =');
    assert.equal(entries.id.attrs.attr1, '');
  });

  it('empty attribute with white spaces', function() {
    var entries = PropertiesParser.parse(null, 'id.attr1 = ');
    assert.equal(entries.id.attrs.attr1, '');
  });

  it('attribute with value', function() {
    var entries = PropertiesParser.parse(null, 'id=foo\nid.attr1 = foo2');
    assert.equal(entries.id.value, 'foo');
    assert.equal(entries.id.attrs.attr1, 'foo2');
  });

  it('complex attribute', function() {
    var entries = PropertiesParser.parse(null,
      'id=pre {{ foo }} post\nid.attr1 = pre1 {{ foo }} post1');
    assert.equal(entries.id.value[0], 'pre ');
    assert.equal(entries.id.value[1].name, 'foo');
    assert.equal(entries.id.value[2], ' post');
    assert.equal(entries.id.attrs.attr1.value[0], 'pre1 ');
    assert.equal(entries.id.attrs.attr1.value[1].name, 'foo');
    assert.equal(entries.id.attrs.attr1.value[2], ' post1');
  });

  it('attribute errors', function() {
    var strings = [
      ['key.foo.bar = foo', /Nested attributes are not supported./],
      ['key.$attr = foo', /Attribute can't start/],
    ];

    for (var i in strings) {
      if (strings.hasOwnProperty(i)) {

        /* jshint -W083 */
        assert.throws(function() {
          PropertiesParser.parse(null, strings[i][0]);
        }, strings[i][1]);
      }
    }
  });

  it('plural macro', function() {
    var entries = PropertiesParser.parse(null,
      'id = {[ plural(m) ]} \nid[one] = foo');
    assert.equal(entries.id.value.one, 'foo');
    assert.equal(entries.id.index.length, 1);
    assert.equal(entries.id.index[0].expr.prop, 'plural');
    assert.equal(entries.id.index[0].args[0].name, 'm');
  });

  it('plural macro with a key matching an entity name', function() {
    var entries = PropertiesParser.parse(null,
      'other = Other\nid = {[ plural(m) ]} \nid[other] = foo');
    assert.equal(entries.id.value.other, 'foo');
  });

  it('plural macro on attribute', function() {
    var entries = PropertiesParser.parse(null,
      'id.attr1 = {[ plural(m) ]} \nid.attr1[one] = foo');
    assert.equal(entries.id.attrs.attr1.value.one, 'foo');
    assert.equal(entries.id.attrs.attr1.index.length, 1);
    assert.equal(entries.id.attrs.attr1.index[0].expr.prop, 'plural');
    assert.equal(entries.id.attrs.attr1.index[0].args[0].name, 'm');
  });

  it('plural macro on value and attribute', function() {
    var entries = PropertiesParser.parse(null,
      'id={[plural(n)]}\nid[one]=foo\n' +
      'id.attr1 = {[ plural(m) ]} \nid.attr1[one] = foo');
    assert.equal(entries.id.index.length, 1);
    assert.equal(entries.id.value.one, 'foo');
    assert.equal(entries.id.attrs.attr1.value.one, 'foo');
    assert.equal(entries.id.attrs.attr1.index.length, 1);
    assert.equal(entries.id.attrs.attr1.index[0].expr.prop, 'plural');
    assert.equal(entries.id.attrs.attr1.index[0].args[0].name, 'm');
  });

  it('plural macro errors', function() {
    var strings = [
      'id = {[ plural(m) ] \nid[one] = foo',
      'id = {[ plural(m) \nid[one] = foo',
      'id = { plural(m) ]} \nid[one] = foo',
      'id = plural(m) ]} \nid[one] = foo',
      'id = {[ plural(m ]} \nid[one] = foo',
      'id = {[ pluralm) ]} \nid[one] = foo',

    ];
    var errorsThrown = 0;

    for (var i in strings) {
      if (strings.hasOwnProperty(i)) {
        try {
          PropertiesParser.parse(null, strings[i]);
        } catch (e) {
          errorsThrown += 1;
        }
      }
    }
    assert.equal(errorsThrown, strings.length);
  });

  it('comment', function() {
    var entries = PropertiesParser.parse(null, '#test');
    assert.equal(Object.keys(entries).length, 0);
  });

  it('comment errors', function() {
    var strings = [
      ' # foo',
      ' ## foo',
      'f# foo',
    ];
    for (var i in strings) {
      if (strings.hasOwnProperty(i)) {
        var entries = PropertiesParser.parse(null, strings[i]);
        assert.equal(Object.keys(entries).length, 0);
      }
    }
  });

  it('duplicate errors', function() {
    var strings = [
      'foo=value1\nfoo=value2',
      'foo=value\nfoo.attr1=value\nfoo.attr1=value2',
      'foo={[plural(n)]}\nfoo[one]=value\nfoo[one]=value2',
      'foo.bar={[plural(n)]}\nfoo.bar[one]=value\nfoo.bar[one]=value2',
    ];
    for (var i in strings) {
      /* jshint -W083 */
      if (strings.hasOwnProperty(i)) {
        assert.throws(function() {
          PropertiesParser.parse(null, strings[i]);
        }, /Duplicated/);
      }
    }
  });
});
