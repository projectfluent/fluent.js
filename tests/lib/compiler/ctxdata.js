'use strict';

var should = require('should');

var Parser = require('../../../lib/l20n/parser').Parser;
var compile = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').compile
  : require('../../../lib/l20n/compiler').compile;
var getPluralRule = require('../../../lib/l20n/plurals').getPluralRule;

var parser = new Parser();

describe('Context data', function(){
  var source, ctxdata, env;
  beforeEach(function() {
    env = compile(parser.parse(source));
    env.__plural = getPluralRule('en-US');
  });

  describe('in entities', function(){
    before(function() {
      ctxdata = {
        unreadNotifications: 3,
        foo: "Foo"
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
      var value = env.unread.toString(ctxdata);
      value.should.equal('Unread notifications: 3');
    });
    it('can be passed as argument to a macro', function() {
      var value = env.unreadPlural.toString(ctxdata);
      value.should.equal('3 unread notifications');
    });
    it('takes priority over entities of the same name', function() {
      var value = env.useFoo.toString(ctxdata);
      value.should.equal('Foo');
    });
  });

  describe('and simple errors', function(){
    before(function() {
      ctxdata = {
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
    it('returns the raw string when a missing property of ctxdata is referenced', function(){
      var value = env.missingReference.toString(ctxdata);
      value.should.equal('{{ missing }}');
    });
    it('returns the raw string when an object is referenced', function(){
      var value = env.nestedReference.toString(ctxdata);
      value.should.equal('{{ nested }}');
    });
    it('returns the raw string when watch is referenced', function(){
      var value = env.watchReference.toString(ctxdata);
      value.should.equal('{{ watch }}');
    });
    it('returns the raw string when hasOwnProperty is referenced', function(){
      var value = env.hasOwnPropertyReference.toString(ctxdata);
      value.should.equal('{{ hasOwnProperty }}');
    });
    it('returns the raw string when isPrototypeOf is referenced', function(){
      var value = env.isPrototypeOfReference.toString(ctxdata);
      value.should.equal('{{ isPrototypeOf }}');
    });
    it('returns the raw string when toString is referenced', function(){
      var value = env.toStringReference.toString(ctxdata);
      value.should.equal('{{ toString }}');
    });
    it('returns the raw string when __proto__ is referenced', function(){
      var value = env.protoReference.toString(ctxdata);
      value.should.equal('{{ __proto__ }}');
    });
  });

  describe('and strings', function(){
    before(function() {
      ctxdata = {
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
      env.stringProp.toString(ctxdata).should.equal('string');
    });
    it('is undefined when used in a macro', function(){
      var value = env.stringIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
    it('digit returns a string value', function(){
      env.stringNumProp.toString(ctxdata).should.equal('1');
    });
    it('digit returns undefined when used in a macro', function(){
      var value = env.stringNumIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and numbers', function(){
    before(function() {
      ctxdata = {
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
      env.numProp.toString(ctxdata).should.equal('1');
    });
    it('returns a value when used in macro', function(){
      env.numIndex.toString(ctxdata).should.equal('One');
    });
    it('returns the raw string when NaN is referenced', function(){
      var value = env.nanProp.toString(ctxdata);
      value.should.equal('{{ nan }}');
    });
    it('is undefined when NaN is used in macro', function(){
      var value = env.nanIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and bools', function(){
    before(function() {
      ctxdata = {
        bool: true
      };
      source = [
        'boolProp={{ bool }}',
        'boolIndex={[ plural(bool) ]}',
        'boolIndex[one]=One'
      ].join('\n');
    });
    it('returns the raw string when referenced', function(){
      var value = env.boolProp.toString(ctxdata);
      value.should.equal('{{ bool }}');
    });
    it('is undefined when used in a macro', function(){
      var value = env.boolIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and undefined', function(){
    before(function() {
      ctxdata = {
        undef: undefined
      };
      source = [
        'undefProp={{ undef }}',
        'undefIndex={[ plural(undef) ]}',
        'undefIndex[one]=One'
      ].join('\n');
    });
    it('returns the raw string when referenced', function(){
      var value = env.undefProp.toString(ctxdata);
      value.should.equal('{{ undef }}');
    });
    it('is undefined when used in a macro', function(){
      var value = env.undefIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and null', function(){
    before(function() {
      ctxdata = {
        nullable: null
      };
      source = [
        'nullProp={{ nullable }}',
        'nullIndex={[ plural(nullable) ]}',
        'nullIndex[one]=One'
      ].join('\n');
    });
    it('returns the raw string', function(){
      var value = env.nullProp.toString(ctxdata);
      value.should.equal('{{ nullable }}');
    });
    it('is undefined when used in a macro', function(){
      var value = env.nullIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and arrays where first element is number', function(){
    before(function() {
      ctxdata = {
        arr: [1, 2]
      };
      source = [
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n');
    });
    it('returns the raw string', function(){
      var value = env.arrProp.toString(ctxdata);
      value.should.equal('{{ arr }}');
    });
    it('is undefined when used in a macro', function(){
      var value = env.arrIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and arrays where first element is not a number', function(){
    before(function() {
      ctxdata = {
        arr: ['a', 'b']
      };
      source = [
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n');
    });
    it('returns the raw string', function(){
      var value = env.arrProp.toString(ctxdata);
      value.should.equal('{{ arr }}');
    });
    it('is undefined when used in a macro', function(){
      var value = env.arrIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

  describe('and objects', function(){
    before(function() {
      ctxdata = {
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
      var value = env.objProp.toString(ctxdata);
      value.should.equal('{{ obj }}');
    });
    it('is undefined when used in a macro', function(){
      var value = env.objIndex.toString(ctxdata);
      should.equal(value, undefined);
    });
  });

});
