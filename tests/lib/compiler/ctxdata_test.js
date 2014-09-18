/* global it, before, beforeEach, assert:true, describe, requireApp */
'use strict';
var compile, assert;

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/compiler/header.js');
} else {
  compile = require('./header.js').compile;
  assert = require('./header.js').assert;
}

describe('Context data', function(){
  var source, args, ctx;

  beforeEach(function() {
    ctx = compile(source);
  });

  describe('in entities', function(){

    before(function() {
      args = {
        unreadNotifications: 3,
        foo: 'Foo'
      };
      source = [
        'unread=Unread notifications: {{ unreadNotifications }}',
        'unreadPlural={[ plural(unreadNotifications) ]}',
        'unreadPlural[one]=One unread notification',
        'unreadPlural[other]={{ unreadNotifications}} unread notifications',
        'foo=Bar',
        'useFoo={{ foo }}'
      ].join('\n');
    });

    it('can be referenced from strings', function() {
      var value = ctx.cache.unread.format(ctx, args);
      assert.strictEqual(value, 'Unread notifications: 3');
    });

    it('can be passed as argument to a macro', function() {
      var value = ctx.cache.unreadPlural.format(ctx, args);
      assert.strictEqual(value, '3 unread notifications');
    });

    it('takes priority over entities of the same name', function() {
      var value = ctx.cache.useFoo.format(ctx, args);
      assert.strictEqual(value, 'Foo');
    });

  });

  describe('and simple errors', function(){

    before(function() {
      args = {
        nested: {
        }
      };
      source = [
        'missingReference={{ missing }}',
        'nestedReference={{ nested }}',
        'watchReference={{ watch }}',
        'hasOwnPropertyReference={{ hasOwnProperty }}',
        'isPrototypeOfReference={{ isPrototypeOf }}',
        'toStringReference={{ toString }}',
        'protoReference={{ __proto__ }}',
      ].join('\n');
    });

    it('returns the raw string when a missing property of args is ' +
       'referenced', function(){
      var value = ctx.cache.missingReference.format(ctx, args);
      assert.strictEqual(value, '{{ missing }}');
    });

    it('returns the raw string when an object is referenced', function(){
      var value = ctx.cache.nestedReference.format(ctx, args);
      assert.strictEqual(value, '{{ nested }}');
    });

    it('returns the raw string when watch is referenced', function(){
      var value = ctx.cache.watchReference.format(ctx, args);
      assert.strictEqual(value, '{{ watch }}');
    });

    it('returns the raw string when hasOwnProperty is referenced', function(){
      var value = ctx.cache.hasOwnPropertyReference.format(ctx, args);
      assert.strictEqual(value, '{{ hasOwnProperty }}');
    });

    it('returns the raw string when isPrototypeOf is referenced', function(){
      var value = ctx.cache.isPrototypeOfReference.format(ctx, args);
      assert.strictEqual(value, '{{ isPrototypeOf }}');
    });

    it('returns the raw string when toString is referenced', function(){
      var value = ctx.cache.toStringReference.format(ctx, args);
      assert.strictEqual(value, '{{ toString }}');
    });

    it('returns the raw string when __proto__ is referenced', function(){
      var value = ctx.cache.protoReference.format(ctx, args);
      assert.strictEqual(value, '{{ __proto__ }}');
    });

  });

  describe('and strings', function(){

    before(function() {
      args = {
        str: 'string',
        num: '1'
      };
      source = [
        'stringProp={{ str }}',
        'stringIndex={[ plural(str) ]}',
        'stringIndex[one]=One',
        'stringNumProp={{ num }}',
        'stringNumIndex={[ plural(num) ]}',
        'stringNumIndex[one]=One'
      ].join('\n');
    });

    it('returns a string value', function(){
      assert.strictEqual(ctx.cache.stringProp.format(ctx, args), 'string');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.stringIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

    it('digit returns a string value', function(){
      assert.strictEqual(ctx.cache.stringNumProp.format(ctx, args), '1');
    });

    it('digit returns undefined when used in a macro', function(){
      var value = ctx.cache.stringNumIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and numbers', function(){

    before(function() {
      args = {
        num: 1,
        nan: NaN
      };
      source = [
        'numProp={{ num }}',
        'numIndex={[ plural(num) ]}',
        'numIndex[one]=One',
        'nanProp={{ nan }}',
        'nanIndex={[ plural(nan) ]}',
        'nanIndex[one]=One'
      ].join('\n');
    });

    it('returns a number value', function(){
      assert.strictEqual(ctx.cache.numProp.format(ctx, args), '1');
    });

    it('returns a value when used in macro', function(){
      assert.strictEqual(ctx.cache.numIndex.format(ctx, args), 'One');
    });

    it('returns the raw string when NaN is referenced', function(){
      var value = ctx.cache.nanProp.format(ctx, args);
      assert.strictEqual(value, '{{ nan }}');
    });

    it('is undefined when NaN is used in macro', function(){
      var value = ctx.cache.nanIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and bools', function(){

    before(function() {
      args = {
        bool: true
      };
      source = [
        'boolProp={{ bool }}',
        'boolIndex={[ plural(bool) ]}',
        'boolIndex[one]=One'
      ].join('\n');
    });

    it('returns the raw string when referenced', function(){
      var value = ctx.cache.boolProp.format(ctx, args);
      assert.strictEqual(value, '{{ bool }}');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.boolIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and undefined', function(){

    before(function() {
      args = {
        undef: undefined
      };
      source = [
        'undefProp={{ undef }}',
        'undefIndex={[ plural(undef) ]}',
        'undefIndex[one]=One'
      ].join('\n');
    });

    it('returns the raw string when referenced', function(){
      var value = ctx.cache.undefProp.format(ctx, args);
      assert.strictEqual(value, '{{ undef }}');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.undefIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and null', function(){

    before(function() {
      args = {
        nullable: null
      };
      source = [
        'nullProp={{ nullable }}',
        'nullIndex={[ plural(nullable) ]}',
        'nullIndex[one]=One'
      ].join('\n');
    });

    it('returns the raw string', function(){
      var value = ctx.cache.nullProp.format(ctx, args);
      assert.strictEqual(value, '{{ nullable }}');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.nullIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and arrays where first element is number', function(){

    before(function() {
      args = {
        arr: [1, 2]
      };
      source = [
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n');
    });

    it('returns the raw string', function(){
      var value = ctx.cache.arrProp.format(ctx, args);
      assert.strictEqual(value, '{{ arr }}');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.arrIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and arrays where first element is not a number', function(){

    before(function() {
      args = {
        arr: ['a', 'b']
      };
      source = [
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n');
    });

    it('returns the raw string', function(){
      var value = ctx.cache.arrProp.format(ctx, args);
      assert.strictEqual(value, '{{ arr }}');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.arrIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });

  });

  describe('and objects', function(){

    before(function() {
      args = {
        obj: {
          key: 'value'
        }
      };
      source = [
        'objProp={{ obj }}',
        'objIndex={[ plural(obj) ]}',
        'objIndex[one]=One'
      ].join('\n');
    });

    it('returns the raw string', function(){
      var value = ctx.cache.objProp.format(ctx, args);
      assert.strictEqual(value, '{{ obj }}');
    });

    it('is undefined when used in a macro', function(){
      var value = ctx.cache.objIndex.format(ctx, args);
      assert.strictEqual(value, undefined);
    });
  });

});
