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
    ];
    for (var i in strings) {
      /* jshint -W083 */
      if (strings.hasOwnProperty(i)) {
        assert.throws(function() {
          PropertiesParser.parse(null, strings[i]);
        });
      }
    }
  });
});
