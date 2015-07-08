'use strict';

import assert from 'assert';
import { walkEntry } from '../../src/lib/pseudo';
import PropertiesParser from '../../src/lib/format/properties/parser';

var reVowels = /[AEIOUaeiou]/;

function digest(str) {
  var cur = 0;
  var i = str.length;
  while (i) {
    if (reVowels.test(str[--i])) {
      cur++;
    }
  }
  return cur;
}

describe('walkEntry', function() {
  var source, entries;

  beforeEach(function() {
    entries = PropertiesParser.parse(null, source);
  });

  describe('simple strings and attributes', function(){

    before(function() {
      source = [
        'foo=Foo',
        'foo.attr=An attribute',
      ].join('\n');
    });

    it('walks the value', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.strictEqual(walked.value, 2);
    });

    it('walks the attribute', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.strictEqual(walked.attrs.attr, 5);
    });

  });

  describe('one-level-deep dict', function(){

    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[one]=One',
        'foo[two]=Two',
        'foo[few]=Few',
        'foo[many]=Many',
        'foo[other]=Other',
      ].join('\n');
    });

    it('walks the values', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.strictEqual(walked.value.one, 2);
      assert.strictEqual(walked.value.two, 1);
      assert.strictEqual(walked.value.few, 1);
      assert.strictEqual(walked.value.many, 1);
      assert.strictEqual(walked.value.other, 2);
    });

    it('does not modify the index', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.deepEqual(walked.index[0], {
        type: 'call',
        expr: {
          type: 'prop',
          expr: {
            type: 'glob',
            name: 'cldr'
          },
          prop: 'plural',
          cmpt: false
        },
        args: [{
          type: 'idOrVar',
          name: 'n'
        }]
      });
    });

  });

  // XXX parser currently doesn't support nested dicts
  describe.skip('two-level-deep dict', function(){

    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[other]={[ plural(m) ]}',
        'foo[other][one]=One',
        'foo[other][two]=Two',
        'foo[other][few]=Few',
        'foo[other][many]=Many',
        'foo[other][other]=Other',
      ].join('\n');
    });

    it('walks the values', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.strictEqual(walked.$v.other.one, 2);
      assert.strictEqual(walked.$v.other.two, 1);
      assert.strictEqual(walked.$v.other.few, 1);
      assert.strictEqual(walked.$v.other.many, 1);
      assert.strictEqual(walked.$v.other.other, 2);
    });

    it('does not modify the indexes', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.deepEqual(
        walked.$x, [{t: 'idOrVar', v: 'plural'}, 'n']);
      assert.deepEqual(
        walked.$v.other.$x, [{t: 'idOrVar', v: 'plural'}, 'n']);
    });

  });

  describe('attribute that is a one-level-deep dict', function(){

    before(function() {
      source = [
        'foo.attr={[ plural(n) ]}',
        'foo.attr[one]=One',
        'foo.attr[two]=Two',
        'foo.attr[few]=Few',
        'foo.attr[many]=Many',
        'foo.attr[other]=Other',
      ].join('\n');
    });

    it('walks the values', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.strictEqual(walked.attrs.attr.value.one, 2);
      assert.strictEqual(walked.attrs.attr.value.two, 1);
      assert.strictEqual(walked.attrs.attr.value.few, 1);
      assert.strictEqual(walked.attrs.attr.value.many, 1);
      assert.strictEqual(walked.attrs.attr.value.other, 2);
    });

    it('does not modify the indexes', function(){
      var walked = walkEntry(entries.foo, digest);
      assert.deepEqual(walked.attrs.attr.index[0], {
        type: 'call',
        expr: {
          type: 'prop',
          expr: {
            type: 'glob',
            name: 'cldr'
          },
          prop: 'plural',
          cmpt: false
        },
        args: [{
          type: 'idOrVar',
          name: 'n'
        }]
      });
    });

  });

});
