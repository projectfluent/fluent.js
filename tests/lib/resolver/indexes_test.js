'use strict';

import assert from 'assert';
import { format, lang, createEntries, MockContext } from './header';

describe('Index', function(){
  var entries, ctx;

  describe('Different values of index', function(){

    before(function() {
      entries = createEntries([
        'foo=one',
        'indexEntity={[ foo ]}',
        'indexEntity[one]=One entity',
        'indexUncalledMacro={[ plural ]}',
        'indexUncalledMacro[one]=One uncalled macro',
        'indexCalledMacro={[ plural(n) ]}',
        'indexCalledMacro[one]=One called macro',
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('works when the index is a regular entity', function() {
      var value = format(ctx, lang, {n: 1}, entries.indexEntity)[1];
      assert.strictEqual(value, 'One entity');
    });
    it('throws when the index is an uncalled macro', function() {
      assert.throws(function() {
        format(ctx, lang, {n: 1}, entries.indexUncalledMacro);
      }, 'Unresolvable value');
    });
    it('works when the index is a called macro', function() {
      var value = format(ctx, lang, {n: 1}, entries.indexCalledMacro)[1];
      assert.strictEqual(value, 'One called macro');
    });

  });

  describe('Cyclic reference to the same entity', function(){

    before(function() {
      entries = createEntries([
        'foo={[ plural(foo) ]}',
        'foo[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('is undefined', function() {
      assert.throws(function() {
        format(ctx, lang, null, entries.foo);
      }, 'Cyclic reference detected: foo');
    });

  });

  describe('Reference from an attribute to the value of the same ' +
           'entity', function(){

    before(function() {
      entries = createEntries([
        'foo=Foo',
        'foo.attr={[ plural(foo) ]}',
        'foo.attr[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('value of the attribute is undefined', function() {
      assert.strictEqual(format(ctx, lang, null, entries.foo)[1], 'Foo');
      assert.throws(function() {
        format(ctx, lang, null, entries.foo.attrs.attr);
      }, 'Unresolvable value');
    });

  });

});
