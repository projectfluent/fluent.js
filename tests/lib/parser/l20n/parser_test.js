'use strict';

import assert from 'assert';
import L20nParser from '../../../../src/lib/format/l20n/entries/parser';

var parse = L20nParser.parse.bind(L20nParser);

describe('L20n Parser', function() {
  describe('Parser', function() {
    it('malformed entity errors', function() {
      var strings = [
        'd',
        '<',
        '<i',
        '<id',
        '<id<',
        '<id ',
        '<>',
        '<"">',
        '< "">',
        '< id>',
        '<id>',
        '<id>',
        '<id ">',
        '<id \'>',
        '<id ""',
        '<id <',
        '<<',
        '< <',
        '<!id',
        '<*id',
        '<id "value>',
        '<id value">',
        '<id \'value">',
        '<id \'value>',
        '<id value\'>',
        '<id"value">',
        '< id "value">',
      ];
      for (var i in strings) {
        /* jshint -W083 */
        if (strings.hasOwnProperty(i)) {
          assert.throws(function() {
            parse(null, strings[i]);
          });
        }
      }
    });
  });

  describe('Simple strings', function() {
    it('string value with double quotes', function() {
      var entries = parse(null, '<id "string">');
      assert.strictEqual(entries.id, 'string');
    });

    it.skip('string value with single quotes', function() {
      var entries = parse(null, '<id \'string\'>');
      assert.strictEqual(entries.id, 'string');
    });

    it.skip('empty value', function() {
      var entries = parse(null, '<id "">');
      assert.equal(entries.id, '');
    });
  });

  describe('String escapes', function() {
    it('single doublequote escape', function() {
      var entries = parse(null, '<id "\\"">');
      assert.strictEqual(entries.id, '"');
    });

    it('single singlequote escape', function() {
      var entries = parse(null, '<id \'\\\'\'>');
      assert.strictEqual(entries.id, '\'');
    });

    it('single doublequote escape in the middle of a word', function() {
      var entries = parse(null, '<id "str\\"ing">');
      assert.strictEqual(entries.id, 'str"ing');
    });

    it('double escape', function() {
      var entries = parse(null, '<id "test \\\\ more">');
      assert.strictEqual(entries.id, 'test \\ more');
    });

    it('double escape at the end', function() {
      var entries = parse(null, '<id "test \\\\">');
      assert.strictEqual(entries.id, 'test \\');
    });
  });

  describe('Unicode escapes', function() {
    it('simple unicode escape', function() {
      var entries = parse(null, '<id "string \\ua0a0 foo">');
      assert.strictEqual(entries.id, 'string ꂠ foo');
    });

    it('unicode escapes before placeable and end', function() {
      var entries = parse(null, '<id "string \\ua0a0{{ foo }} foo \\ua0a0">');
      assert.strictEqual(entries.id.value[0], 'string ꂠ');
      assert.strictEqual(entries.id.value[2], ' foo ꂠ');
    });
  });

  describe('Complex strings', function() {
    it('string with a placeable', function() {
      var entries = parse(null, '<id "test {{ var }} test2">');
      assert.strictEqual(entries.id.value[0], 'test ');
      assert.deepEqual(entries.id.value[1], { type: 'id', name: 'var' });
      assert.strictEqual(entries.id.value[2], ' test2');
    });

    it('string with an escaped double quote', function() {
      var entries = parse(null, '<id "test \\\" {{ var }} test2">');
      assert.strictEqual(entries.id.value[0], 'test " ');
      assert.deepEqual(entries.id.value[1], { type: 'id', name: 'var' });
      assert.strictEqual(entries.id.value[2], ' test2');
    });
  });

  describe('Hash values', function() {
    it('simple hash value', function() {
      var entries = parse(null, '<id {*one: "One", many: "Many"}>');
      assert.strictEqual(entries.id.value.one, 'One');
      assert.strictEqual(entries.id.value.many, 'Many');
    });

    it('simple hash value with a trailing comma', function() {
      var entries = parse(null, '<id {one: "One", *many: "Many", }>');
      assert.strictEqual(entries.id.value.one, 'One');
      assert.strictEqual(entries.id.value.many, 'Many');
    });

    it('nested hash value', function() {
      var entries = parse(null, '<id {*one: {*oneone: "foo"}, many: "Many"}>');
      assert.strictEqual(entries.id.value.one.oneone, 'foo');
      assert.strictEqual(entries.id.value.many, 'Many');
    });

    it('hash value with a complex string', function() {
      var entries = parse(null, '<id {*one: "foo {{ $n }}", many: "Many"}>');
      assert.strictEqual(entries.id.value.one[0], 'foo ');
      assert.deepEqual(entries.id.value.one[1], {type: 'var', name: 'n'});
    });

    it('hash errors', function() {
      var strings = [
        '<id {}>',
        '<id {a: 2}>',
        '<id {a: "d">',
        '<id a: "d"}>',
        '<id {{a: "d"}>',
        '<id {a: "d"}}>',
        '<id {a:} "d"}>',
        '<id {2}>',
        '<id {"a": "foo"}>',
        '<id {"a": \'foo\'}>',
        '<id {2: "foo"}>',
        '<id {a:"foo"b:"foo"}>',
        '<id {a }>',
        '<id {a: 2, b , c: 3 } >',
        '<id {*a: "v", *b: "c"}>',
        '<id {}>',
        '<id {one: "value", two: "value2"}>'
      ];
      for (var i in strings) {
        /* jshint -W083 */
        if (strings.hasOwnProperty(i)) {
          assert.throws(function() {
            parse(null, strings[i]);
          });
        }
      }
    });
  });

  describe('Attributes', function() {
    it('simple attribute', function() {
      var entries = parse(null, '<id "foo" title: "Title">');
      assert.strictEqual(entries.id.attrs.title, 'Title');
    });

    it('two attributes', function() {
      var entries = parse(null, '<id "foo" title: "Title" placeholder: "P">');
      assert.strictEqual(entries.id.attrs.title, 'Title');
      assert.strictEqual(entries.id.attrs.placeholder, 'P');
    });

    it('attribute with no value', function() {
      var entries = parse(null, '<id title: "Title">');
      assert.strictEqual(entries.id.value, undefined);
      assert.strictEqual(entries.id.attrs.title, 'Title');
    });

    it('attribute with a complex value', function() {
      var entries = parse(null, '<id title: "Title {{ $n }}">');
      assert.strictEqual(entries.id.attrs.title.value[0], 'Title ');
      assert.deepEqual(entries.id.attrs.title.value[1],
        {type: 'var', name: 'n'});
    });

    it('attribute with hash value', function() {
      var entries = parse(null, '<id title: {*one: "One"}>');
      assert.strictEqual(entries.id.attrs.title.value.one, 'One');
    });

    it('attribute errors', function() {
      var strings = [
        '<id : "foo">',
        '<id "value" : "foo">',
        '<id 2: "foo">',
        '<id a: >',
        '<id: "">',
        '<id a: b:>',
        '<id a: "foo" "heh">',
        '<id a: 2>',
        '<id "a": "a">',
        '<id a2:"a"a3:"v">',
      ];
      for (var i in strings) {
        /* jshint -W083 */
        if (strings.hasOwnProperty(i)) {
          assert.throws(function() {
            parse(null, strings[i]);
          });
        }
      }
    });
  });

  describe('Expressions', function() {
    it('call expression', function() {
      var entries = parse(null, '<id[@cldr.plural($n)] "foo">');
      assert.strictEqual(entries.id.index[0].type, 'call');
      assert.strictEqual(entries.id.index[0].expr.prop, 'plural');
      assert.strictEqual(entries.id.index[0].args[0].name, 'n');
    });

    it('identifier errors', function() {
      var strings = [
        '<i`d "foo">',
        '<0d "foo">',
        '<09 "foo">',
        '<i!d "foo">',
        '<id[i`d] "foo">',
        '<id[0d] "foo">',
        '<id[i!d] "foo">',
      ];
      for (var i in strings) {
        /* jshint -W083 */
        if (strings.hasOwnProperty(i)) {
          assert.throws(function() {
            parse(null, strings[i]);
          });
        }
      }
    });
  });

  describe('Duplicates', function() {
    it('duplicate entities', function() {
      var strings = [
        '<id1 "Value"><id1 "Value2">',
      ];
      for (var i in strings) {
        /* jshint -W083 */
        if (strings.hasOwnProperty(i)) {
          assert.throws(function() {
            parse(null, strings[i]);
          });
        }
      }
    });

    it('duplicate attributes', function() {
      var strings = [
        '<id1 "val" attr1: "Value" attr1: "Value2">',
      ];
      for (var i in strings) {
        /* jshint -W083 */
        if (strings.hasOwnProperty(i)) {
          assert.throws(function() {
            parse(null, strings[i]);
          });
        }
      }
    });
  });
});
