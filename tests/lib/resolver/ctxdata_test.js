/* global assert:true, it, before, describe, requireApp */
'use strict';

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/resolver/header.js');
} else {
  var assert = require('assert');
  var Resolver = require('./header').Resolver;
  var createEntries = require('./header').createEntries;
  var MockContext = require('./header').MockContext;
}

describe('Context data', function(){
  var entries, ctx, args;

  describe('in entities', function(){

    before(function() {
      args = {
        unreadNotifications: 3,
        foo: 'Foo'
      };
      entries = createEntries([
        'unread=Unread notifications: {{ unreadNotifications }}',
        'unreadPlural={[ plural(unreadNotifications) ]}',
        'unreadPlural[one]=One unread notification',
        'unreadPlural[other]={{ unreadNotifications}} unread notifications',
        'foo=Bar',
        'useFoo={{ foo }}'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('can be referenced from strings', function() {
      var value = Resolver.format(ctx, args, entries.unread)[1];
      assert.strictEqual(value, 'Unread notifications: 3');
    });

    it('can be passed as argument to a macro', function() {
      var value = Resolver.format(ctx, args, entries.unreadPlural)[1];
      assert.strictEqual(value, '3 unread notifications');
    });

    it('takes priority over entities of the same name', function() {
      var value = Resolver.format(ctx, args, entries.useFoo)[1];
      assert.strictEqual(value, 'Foo');
    });

  });

  describe('and simple errors', function(){

    before(function() {
      args = {
        nested: {
        }
      };
      entries = createEntries([
        'missingReference={{ missing }}',
        'nestedReference={{ nested }}',
        'watchReference={{ watch }}',
        'hasOwnPropertyReference={{ hasOwnProperty }}',
        'isPrototypeOfReference={{ isPrototypeOf }}',
        'toStringReference={{ toString }}',
        'protoReference={{ __proto__ }}',
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string when a missing property of args is ' +
       'referenced', function(){
      var value = Resolver.format(ctx, args, entries.missingReference)[1];
      assert.strictEqual(value, '{{ missing }}');
    });

    it('returns the raw string when an object is referenced', function(){
      var value = Resolver.format(ctx, args, entries.nestedReference)[1];
      assert.strictEqual(value, '{{ nested }}');
    });

    it('returns the raw string when watch is referenced', function(){
      var value = Resolver.format(ctx, args, entries.watchReference)[1];
      assert.strictEqual(value, '{{ watch }}');
    });

    it('returns the raw string when hasOwnProperty is referenced', function(){
      var value = Resolver.format(
        ctx, args, entries.hasOwnPropertyReference)[1];
      assert.strictEqual(value, '{{ hasOwnProperty }}');
    });

    it('returns the raw string when isPrototypeOf is referenced', function(){
      var value = Resolver.format(
        ctx, args, entries.isPrototypeOfReference)[1];
      assert.strictEqual(value, '{{ isPrototypeOf }}');
    });

    it('returns the raw string when toString is referenced', function(){
      var value = Resolver.format(ctx, args, entries.toStringReference)[1];
      assert.strictEqual(value, '{{ toString }}');
    });

    it('returns the raw string when __proto__ is referenced', function(){
      var value = Resolver.format(ctx, args, entries.protoReference)[1];
      assert.strictEqual(value, '{{ __proto__ }}');
    });

  });

  describe('and strings', function(){

    before(function() {
      args = {
        str: 'string',
        num: '1'
      };
      entries = createEntries([
        'stringProp={{ str }}',
        'stringIndex={[ plural(str) ]}',
        'stringIndex[one]=One',
        'stringNumProp={{ num }}',
        'stringNumIndex={[ plural(num) ]}',
        'stringNumIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns a string value', function(){
      assert.strictEqual(
        Resolver.format(ctx, args, entries.stringProp)[1], 'string');
    });

    it('throws when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.stringIndex);
      }, 'Unresolvable value');
    });

    it('digit returns a string value', function(){
      assert.strictEqual(
        Resolver.format(ctx, args, entries.stringNumProp)[1], '1');
    });

    it('digit throws when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.stringNumIndex);
      }, 'Unresolvable value');
    });

  });

  describe('and numbers', function(){

    before(function() {
      args = {
        num: 1,
        nan: NaN
      };
      entries = createEntries([
        'numProp={{ num }}',
        'numIndex={[ plural(num) ]}',
        'numIndex[one]=One',
        'nanProp={{ nan }}',
        'nanIndex={[ plural(nan) ]}',
        'nanIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns a number value', function(){
      assert.strictEqual(Resolver.format(ctx, args, entries.numProp)[1], '1');
    });

    it('returns a value when used in macro', function(){
      assert.strictEqual(
        Resolver.format(ctx, args, entries.numIndex)[1], 'One');
    });

    it('returns the raw string when NaN is referenced', function(){
      var value = Resolver.format(ctx, args, entries.nanProp)[1];
      assert.strictEqual(value, '{{ nan }}');
    });

    it('is undefined when NaN is used in macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.nanIndex);
      }, 'Arg must be a string or a number: nan');
    });

  });

  describe('and bools', function(){

    before(function() {
      args = {
        bool: true
      };
      entries = createEntries([
        'boolProp={{ bool }}',
        'boolIndex={[ plural(bool) ]}',
        'boolIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string when referenced', function(){
      var value = Resolver.format(ctx, args, entries.boolProp)[1];
      assert.strictEqual(value, '{{ bool }}');
    });

    it('is undefined when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.boolIndex);
      }, 'Arg must be a string or a number: bool');
    });

  });

  describe('and undefined', function(){

    before(function() {
      args = {
        undef: undefined
      };
      entries = createEntries([
        'undefProp={{ undef }}',
        'undefIndex={[ plural(undef) ]}',
        'undefIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string when referenced', function(){
      var value = Resolver.format(ctx, args, entries.undefProp)[1];
      assert.strictEqual(value, '{{ undef }}');
    });

    it('is undefined when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.undefIndex);
      }, 'Arg must be a string or a number: undef');
    });

  });

  describe('and null', function(){

    before(function() {
      args = {
        nullable: null
      };
      entries = createEntries([
        'nullProp={{ nullable }}',
        'nullIndex={[ plural(nullable) ]}',
        'nullIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = Resolver.format(ctx, args, entries.nullProp)[1];
      assert.strictEqual(value, '{{ nullable }}');
    });

    it('is undefined when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.nullIndex);
      }, 'Arg must be a string or a number: nullable');
    });

  });

  describe('and arrays where first element is number', function(){

    before(function() {
      args = {
        arr: [1, 2]
      };
      entries = createEntries([
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = Resolver.format(ctx, args, entries.arrProp)[1];
      assert.strictEqual(value, '{{ arr }}');
    });

    it('is undefined when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.arrIndex);
      }, 'Arg must be a string or a number: arr');
    });

  });

  describe('and arrays where first element is not a number', function(){

    before(function() {
      args = {
        arr: ['a', 'b']
      };
      entries = createEntries([
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = Resolver.format(ctx, args, entries.arrProp)[1];
      assert.strictEqual(value, '{{ arr }}');
    });

    it('is undefined when used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.arrIndex);
      }, 'Arg must be a string or a number: arr');
    });

  });

  describe('and objects', function(){

    before(function() {
      args = {
        obj: {
          key: 'value'
        }
      };
      entries = createEntries([
        'objProp={{ obj }}',
        'objIndex={[ plural(obj) ]}',
        'objIndex[one]=One'
      ].join('\n'));
      ctx = new MockContext(entries);
    });

    it('returns the raw string', function(){
      var value = Resolver.format(ctx, args, entries.objProp)[1];
      assert.strictEqual(value, '{{ obj }}');
    });

    it('throws used in a macro', function(){
      assert.throws(function() {
        Resolver.format(ctx, args, entries.objIndex);
      }, 'Arg must be a string or a number: obj');
    });
  });

});
