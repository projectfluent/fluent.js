/* global assert:true, it, before, beforeEach, describe, requireApp */
'use strict';

if (typeof navigator !== 'undefined') {
  requireApp('sharedtest/test/unit/l10n/lib/resolver/header.js');
} else {
  var assert = require('assert');
  var Resolver = require('./header').Resolver;
  var createContext = require('./header').createContext;
}

describe('Context data', function(){
  var source, args, ctx;

  beforeEach(function() {
    ctx = createContext(source);
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
      var value = Resolver.formatValue(ctx.cache.unread, ctx, args);
      assert.strictEqual(value, 'Unread notifications: 3');
    });

    it('can be passed as argument to a macro', function() {
      var value = Resolver.formatValue(ctx.cache.unreadPlural, ctx, args);
      assert.strictEqual(value, '3 unread notifications');
    });

    it('takes priority over entities of the same name', function() {
      var value = Resolver.formatValue(ctx.cache.useFoo, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.missingReference, ctx, args);
      assert.strictEqual(value, '{{ missing }}');
    });

    it('returns the raw string when an object is referenced', function(){
      var value = Resolver.formatValue(ctx.cache.nestedReference, ctx, args);
      assert.strictEqual(value, '{{ nested }}');
    });

    it('returns the raw string when watch is referenced', function(){
      var value = Resolver.formatValue(ctx.cache.watchReference, ctx, args);
      assert.strictEqual(value, '{{ watch }}');
    });

    it('returns the raw string when hasOwnProperty is referenced', function(){
      var value = Resolver.formatValue(
        ctx.cache.hasOwnPropertyReference, ctx, args);
      assert.strictEqual(value, '{{ hasOwnProperty }}');
    });

    it('returns the raw string when isPrototypeOf is referenced', function(){
      var value = Resolver.formatValue(
        ctx.cache.isPrototypeOfReference, ctx, args);
      assert.strictEqual(value, '{{ isPrototypeOf }}');
    });

    it('returns the raw string when toString is referenced', function(){
      var value = Resolver.formatValue(
        ctx.cache.toStringReference, ctx, args);
      assert.strictEqual(value, '{{ toString }}');
    });

    it('returns the raw string when __proto__ is referenced', function(){
      var value = Resolver.formatValue(ctx.cache.protoReference, ctx, args);
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
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.stringProp, ctx, args), 'string');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.stringIndex, ctx, args);
      assert.strictEqual(value, undefined);
    });

    it('digit returns a string value', function(){
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.stringNumProp, ctx, args), '1');
    });

    it('digit returns undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.stringNumIndex, ctx, args);
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
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.numProp, ctx, args), '1');
    });

    it('returns a value when used in macro', function(){
      assert.strictEqual(
        Resolver.formatValue(ctx.cache.numIndex, ctx, args), 'One');
    });

    it('returns the raw string when NaN is referenced', function(){
      var value = Resolver.formatValue(ctx.cache.nanProp, ctx, args);
      assert.strictEqual(value, '{{ nan }}');
    });

    it('is undefined when NaN is used in macro', function(){
      var value = Resolver.formatValue(ctx.cache.nanIndex, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.boolProp, ctx, args);
      assert.strictEqual(value, '{{ bool }}');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.boolIndex, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.undefProp, ctx, args);
      assert.strictEqual(value, '{{ undef }}');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.undefIndex, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.nullProp, ctx, args);
      assert.strictEqual(value, '{{ nullable }}');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.nullIndex, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.arrProp, ctx, args);
      assert.strictEqual(value, '{{ arr }}');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.arrIndex, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.arrProp, ctx, args);
      assert.strictEqual(value, '{{ arr }}');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.arrIndex, ctx, args);
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
      var value = Resolver.formatValue(ctx.cache.objProp, ctx, args);
      assert.strictEqual(value, '{{ obj }}');
    });

    it('is undefined when used in a macro', function(){
      var value = Resolver.formatValue(ctx.cache.objIndex, ctx, args);
      assert.strictEqual(value, undefined);
    });
  });

});
