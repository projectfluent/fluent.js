'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { format, lang, createEntries, MockContext } from './header';

describe('Macros', function(){
  var entries, ctx, args;

  describe('referencing macros', function(){

    before(function() {
      args = {
        n: 1
      };
      entries = createEntries([
        'placeMacro={{ plural }}',
        'placeRealMacro={{ __plural }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('throws when resolving (not calling) a macro in a complex ' +
       'string', function() {
      assert.strictEqual(
        format(ctx, lang, args, entries.placeMacro)[1], i('{{ plural }}'));
      assert.strictEqual(
        format(
          ctx, lang, args, entries.placeRealMacro)[1], i('{{ __plural }}'));
    });

  });

  describe('passing arguments', function(){

    before(function() {
      args = {
        n: 1
      };
      entries = createEntries([
        'foo=Foo',
        'useFoo={{ foo }}',
        'bar={[ plural(n) ]}',
        'bar[one]=One',
        'bar.attr=Attr',

        'passFoo={[ plural(foo) ]}',
        'passFoo[one]=One',

        'passUseFoo={[ plural(useFoo) ]}',
        'passUseFoo[one]=One',

        'passBar={[ plural(bar) ]}',
        'passBar[one]=One',

        'passPlural={[ plural(plural) ]}',
        'passPlural[one]=One',

        'passMissing={[ plural(missing) ]}',
        'passMissing[one]=One',

        'passWatch={[ plural(watch) ]}',
        'passWatch[one]=One',
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('throws if an entity is passed', function() {
      assert.throws(function() {
        format(ctx, lang, args, entries.passFoo);
      }, 'Unresolvable value');
    });

    it('throws if a complex entity is passed', function() {
      assert.throws(function() {
        format(ctx, lang, args, entries.passUseFoo);
      }, 'Unresolvable value');
    });

    it('throws if a hash entity is passed', function() {
      assert.throws(function() {
        format(ctx, lang, args, entries.passBar);
      }, 'Unresolvable value');
    });

    it('throws if a macro is passed', function() {
      assert.throws(function() {
        format(ctx, lang, args, entries.passPlural);
      }, 'Unresolvable value');
    });

    it('throws if a missing entry is passed', function() {
      assert.throws(function() {
        format(ctx, lang, args, entries.passMissing);
      }, 'Unknown reference: missing');
    });

    it('throws if a native function is passed', function() {
      assert.throws(function() {
        format(ctx, lang, args, entries.passWatch);
      }, 'Unknown reference: watch');
    });

  });
});

describe('A simple plural macro', function(){
  var entries, ctx;
  var getSimpleMacro = function() {
    return function() {
      return 'other';
    };
  };

  before(function() {
    entries = createEntries([
      'foo={[ plural(n) ]}',
      'foo[zero]=Zero',
      'foo[one]=One',
      'foo[two]=Two',
      'foo[few]=Few',
      'foo[many]=Many',
      'foo[other]=Other'
    ].join('\n'));
    ctx = new MockContext(entries);
    ctx._getMacro = getSimpleMacro;
  });

  it('returns zero for 0', function() {
    var value = format(ctx, lang, {n: 0}, entries.foo)[1];
    assert.strictEqual(value, 'Zero');
  });

  it('returns one for 1', function() {
    var value = format(ctx, lang, {n: 1}, entries.foo)[1];
    assert.strictEqual(value, 'One');
  });

  it('returns two for 2', function() {
    var value = format(ctx, lang, {n: 2}, entries.foo)[1];
    assert.strictEqual(value, 'Two');
  });

  it('returns other for 3', function() {
    var value = format(ctx, lang, {n: 3}, entries.foo)[1];
    assert.strictEqual(value, 'Other');
  });

  it('throws for no arg', function() {
    assert.throws(function() {
      format(ctx, lang, null, entries.foo);
    }, 'Unknown reference: n');
  });

});

describe('A more complex plural macro', function(){
  var entries, ctx;
  var getComplexMacro = function() {
    return function(n) {
      // a made-up plural rule:
      // [0, 1) -> other
      // [1, Inf) -> many
      return (n >= 0 && n < 1) ? 'other' : 'many';
    };
  };

  describe('an entity with all plural forms defined', function(){

    before(function() {
      entries = createEntries([
        'foo={[ plural(n) ]}',
        'foo[zero]=Zero',
        'foo[one]=One',
        'foo[two]=Two',
        'foo[few]=Few',
        'foo[many]=Many',
        'foo[other]=Other'
      ].join('\n'));
      ctx = new MockContext(entries);
      ctx._getMacro = getComplexMacro;
    });

    it('returns zero for 0', function() {
      var value = format(ctx, lang, {n: 0}, entries.foo)[1];
      assert.strictEqual(value, 'Zero');
    });

    it('returns one for 1', function() {
      var value = format(ctx, lang, {n: 1}, entries.foo)[1];
      assert.strictEqual(value, 'One');
    });

    it('returns two for 2', function() {
      var value = format(ctx, lang, {n: 2}, entries.foo)[1];
      assert.strictEqual(value, 'Two');
    });

    it('returns many for 3', function() {
      var value = format(ctx, lang, {n: 3}, entries.foo)[1];
      assert.strictEqual(value, 'Many');
    });

    it('returns many for 5', function() {
      var value = format(ctx, lang, {n: 5}, entries.foo)[1];
      assert.strictEqual(value, 'Many');
    });

    it('returns other for 0.5', function() {
      var value = format(ctx, lang, {n: 0.5}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('throws for no arg', function() {
      assert.throws(function() {
        format(ctx, lang, null, entries.foo);
      }, 'Unknown reference: n');
    });

  });

  describe('an entity without the zero, one and two forms', function(){

    before(function() {
      entries = createEntries([
        'foo={[ plural(n) ]}',
        'foo[many]=Many',
        'foo[other]=Other'
      ].join('\n'));
      ctx = new MockContext(entries);
      ctx._getMacro = getComplexMacro;
    });

    it('returns other for 0', function() {
      var value = format(ctx, lang, {n: 0}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('returns many for 1', function() {
      var value = format(ctx, lang, {n: 1}, entries.foo)[1];
      assert.strictEqual(value, 'Many');
    });

    it('returns many for 2', function() {
      var value = format(ctx, lang, {n: 2}, entries.foo)[1];
      assert.strictEqual(value, 'Many');
    });

    it('returns many for 3', function() {
      var value = format(ctx, lang, {n: 3}, entries.foo)[1];
      assert.strictEqual(value, 'Many');
    });

    it('returns many for 5', function() {
      var value = format(ctx, lang, {n: 5}, entries.foo)[1];
      assert.strictEqual(value, 'Many');
    });

    it('returns other for 0.5', function() {
      var value = format(ctx, lang, {n: 0.5}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

  });

  describe('an entity without the many form', function(){

    before(function() {
      entries = createEntries([
        'foo={[ plural(n) ]}',
        'foo[other]=Other'
      ].join('\n'));
      ctx = new MockContext(entries);
      ctx._getMacro = getComplexMacro;
    });

    it('returns other for 0', function() {
      var value = format(ctx, lang, {n: 0}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('returns other for 1', function() {
      var value = format(ctx, lang, {n: 1}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('returns other for 2', function() {
      var value = format(ctx, lang, {n: 2}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('returns other for 3', function() {
      var value = format(ctx, lang, {n: 3}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('returns other for 5', function() {
      var value = format(ctx, lang, {n: 5}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

    it('returns other for 0.5', function() {
      var value = format(ctx, lang, {n: 0.5}, entries.foo)[1];
      assert.strictEqual(value, 'Other');
    });

  });

  describe('an entity without the other form, but with the one ' +
           'form', function(){

    before(function() {
      entries = createEntries([
        'foo={[ plural(n) ]}',
        'foo[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
      ctx._getMacro = getComplexMacro;
    });

    it('throws for 0', function() {
      assert.throws(function() {
        format(ctx, lang, {n: 0}, entries.foo);
      }, 'Unresolvable value');
    });

    it('returns one for 1', function() {
      var value = format(ctx, lang, {n: 1}, entries.foo)[1];
      assert.strictEqual(value, 'One');
    });

    it('throws for 2', function() {
      assert.throws(function() {
        format(ctx, lang, {n: 2}, entries.foo);
      }, 'Unresolvable value');
    });

    it('throws for 3', function() {
      assert.throws(function() {
        format(ctx, lang, {n: 3}, entries.foo);
      }, 'Unresolvable value');
    });

    it('throws for 5', function() {
      assert.throws(function() {
        format(ctx, lang, {n: 5}, entries.foo);
      }, 'Unresolvable value');
    });

    it('throws for 0.5', function() {
      assert.throws(function() {
        format(ctx, lang, {n: 0.5}, entries.foo);
      }, 'Unresolvable value');
    });

  });

});
