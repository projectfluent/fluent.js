var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Context data', function(){
  var source, ctxdata, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
  });

  describe('in entities', function(){
    before(function() {
      ctxdata = {
        unreadNotifications: 3
      };
      source = '                                                              \
        <plural($n) { $n == 1 ? "one" : "many" }>                             \
        <unread "Unread notifications: {{ $unreadNotifications }}">           \
        <unreadPlural[plural($unreadNotifications)] {                         \
          one: "One unread notification",                                     \
          many: "{{ $unreadNotifications }} unread notifications"             \
        }>                                                                    \
      ';
    });
    it('can be referenced from strings', function() {
      var value = env.unread.getString(ctxdata);
      value.should.equal('Unread notifications: 3');
    });
    it('can be passed as argument to a macro', function() {
      var value = env.unreadPlural.getString(ctxdata);
      value.should.equal('3 unread notifications');
    });
  });

  describe('in macros', function(){
    before(function() {
      ctxdata = {
        n: 3
      };
      source = '                                                              \
        <macro($n) { $n == 1 ? "one" : "many" }>                              \
        <macroNoArg() { $n == 1 ? "one" : "many" }>                           \
        <one "{{ macro(1) }}">                                                \
        <passAsArg "{{ macro($n) }}">                                         \
        <noArgs "{{ macroNoArg() }}">                                         \
      ';
    });
    it('is overriden by macro\'s local args', function() {
      var value = env.one.getString(ctxdata);
      value.should.equal('one');
    });
    it('can be passed to a macro', function() {
      var value = env.passAsArg.getString(ctxdata);
      value.should.equal('many');
    });
    it('is accessible from macro\s body', function() {
      var value = env.noArgs.getString(ctxdata);
      value.should.equal('many');
    });
  });

  describe('and simple errors', function(){
    before(function() {
      ctxdata = {
        nested: {
        }
      };
      source = '                                                              \
        <missing "{{ $missing }}">                                            \
        <missingTwice "{{ $missing.another }}">                               \
        <nested "{{ $nested }}">                                              \
        <nestedMissing "{{ $nested.missing }}">                               \
        <nestedMissingTwice "{{ $nested.missing.another }}">                  \
      ';
    });
    it('throws when a missing property of ctxdata is referenced', function(){
      (function() {
        var value = env.missing.getString(ctxdata);
      }).should.throw(/unknown variable/);
    });
    it('throws when a property of a missing property of ctxdata is referenced', function(){
      (function() {
        var value = env.missingTwice.getString(ctxdata);
      }).should.throw(/unknown variable/);
    });
    it('throws when $nested is referenced', function(){
      (function() {
        var value = env.nested.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
    it('throws when a missing property of $nested is referenced', function(){
      (function() {
        var value = env.nestedMissing.getString(ctxdata);
      }).should.throw(/not defined/);
    });
    it('throws when a property of a missing property of $nested is referenced', function(){
      (function() {
        var value = env.nestedMissingTwice.getString(ctxdata);
      }).should.throw(/not defined/);
    });
  });

  describe('and strings', function(){
    before(function() {
      ctxdata = {
        property: 'property',
        nested: {
          property: 'property',
        }
      };
      source = '                                                              \
        <property "{{ $property }}">                                          \
        <propertyMissing "{{ $property.missing }}">                           \
        <nestedProperty "{{ $nested.property }}">                             \
        <nestedPropertyMissing "{{ $nested.property.missing }}">              \
      ';
    });
    it('returns a string value', function(){
      env.property.getString(ctxdata).should.equal('property');
    });
    it('throws when a property of a string property of ctxdata is referenced', function(){
      (function() {
        var value = env.propertyMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a string: missing/);
    });
    it('returns a string value when nested', function(){
      env.nestedProperty.getString(ctxdata).should.equal('property');
    });
    it('throws when a property of a string property of $nested is referenced', function(){
      (function() {
        var value = env.nestedPropertyMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a string: missing/);
    });
  });

  describe('$nested (a dict-like ctxdata) and numbers', function(){
    before(function() {
      ctxdata = {
        nested: {
          number: 1,
        }
      };
      source = '                                                              \
        <number "{{ $nested.number }}">                                       \
        <numberMissing "{{ $nested.number.missing }}">                        \
        <numberValueOf "{{ $nested.number.valueOf }}">                        \
        <numberIndex[$nested.number] {                                        \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('returns a number value', function(){
      env.number.getString(ctxdata).should.equal('1');
    });
    it('throws when a property of a number property of $nested is referenced', function(){
      (function() {
        var value = env.numberMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a number: missing/);
    });
    it('throws when a built-in property of a number property of $nested is referenced', function(){
      (function() {
        var value = env.numberMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a number: missing/);
    });
    it('throws when a number property of $nested is used in an index', function(){
      (function() {
        var value = env.numberIndex.getString(ctxdata);
      }).should.throw(/Index must be a string/);
    });
  });

  describe('$nested (a dict-like ctxdata) and bools', function(){
    before(function() {
      ctxdata = {
        nested: {
          bool: true,
        }
      };
      source = '                                                              \
        <bool "{{ $nested.bool ? 1 : 0 }}">                                   \
        <boolMissing "{{ $nested.bool.missing }}">                            \
        <boolIndex[$nested.bool] {                                            \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('returns a bool value', function(){
      env.bool.getString(ctxdata).should.equal('1');
    });
    it('throws when a property of a bool property of $nested is referenced', function(){
      (function() {
        var value = env.boolMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a boolean: missing/);
    });
    it('throws when a bool property of $nested is used in an index', function(){
      (function() {
        var value = env.boolIndex.getString(ctxdata);
      }).should.throw(/Index must be a string/);
    });
  });

  describe('$nested (a dict-like ctxdata) and undefined', function(){
    before(function() {
      ctxdata = {
        nested: {
          undef: undefined,
        }
      };
      source = '                                                              \
        <undef "{{ $nested.undef }}">                                         \
        <undefMissing "{{ $nested.undef.missing }}">                          \
        <undefIndex[$nested.undef] {                                          \
          key: "value",                                                       \
          undefined: "undef"                                                  \
        }>                                                                    \
      ';
    });
    it('throws', function(){
      (function() {
        var value = env.undef.getString(ctxdata);
      }).should.throw(/Placeables must be strings or numbers/);
    });
    it('throws when a property of an undefined property of $nested is referenced', function(){
      (function() {
        var value = env.undefMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a undefined: missing/);
    });
    it('throws when an undefined property of $nested is used in an index', function(){
      (function() {
        var value = env.undefIndex.getString(ctxdata);
      }).should.throw(/Hash key lookup failed/);
    });
  });

  describe('$nested (a dict-like ctxdata) and null', function(){
    before(function() {
      ctxdata = {
        nested: {
          nullable: null,
        }
      };
      source = '                                                              \
        <nullable "{{ $nested.nullable }}">                                   \
        <nullableMissing "{{ $nested.nullable.missing }}">                    \
        <nullableIndex[$nested.nullable] {                                    \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws', function(){
      (function() {
        var value = env.nullable.getString(ctxdata);
      }).should.throw(/Placeables must be strings or numbers/);
    });
    it('throws when a property of a null property of $nested is referenced', function(){
      (function() {
        var value = env.nullableMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of a null: missing/);
    });
    it('throws when a null property of $nested is used in an index', function(){
      (function() {
        var value = env.nullableIndex.getString(ctxdata);
      }).should.throw(/Index must be a string/);
    });
  });

  describe('$nested (a dict-like ctxdata) and arrays', function(){
    before(function() {
      ctxdata = {
        nested: {
          arr: [3, 4],
        }
      };
      source = '                                                              \
        <arr "{{ $nested.arr }}">                                             \
        <arrMissing "{{ $nested.arr.missing }}">                              \
        <arrLength "{{ $nested.arr.length }}">                                \
        <arrIndex[$nested.arr] {                                              \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws', function(){
      (function() {
        var value = env.arr.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
    it('throws when a property of an array-typed property of $nested is referenced', function(){
      (function() {
        var value = env.arrMissing.getString(ctxdata);
      }).should.throw(/Cannot get property of an array: missing/);
    });
    it('throws when a built-in property of an array-typed property of $nested is referenced', function(){
      (function() {
        var value = env.arrLength.getString(ctxdata);
      }).should.throw(/Cannot get property of an array: length/);
    });
    it('throws when an array-typed property of $nested is used in an index', function(){
      (function() {
        var value = env.arrIndex.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
  });

  describe('$nested (a dict-like ctxdata) and objects', function(){
    before(function() {
      ctxdata = {
        nested: {
          obj: { key: 'value' }
        }
      };
      source = '                                                              \
        <obj "{{ $nested.obj }}">                                             \
        <objKey "{{ $nested.obj.key }}">                                      \
        <objMissing "{{ $nested.obj.missing }}">                              \
        <objValueOf "{{ $nested.obj.valueOf }}">                              \
        <objIndex[$nested.obj] {                                              \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws if accessed without a key', function(){
      (function() {
        var value = env.obj.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
    it('returns a string value of the requested key', function(){
      env.objKey.getString(ctxdata).should.equal('value');
    });
    it('throws when a property of an object-typed property of $nested is referenced', function(){
      (function() {
        var value = env.objMissing.getString(ctxdata);
      }).should.throw(/missing is not defined on the object/);
    });
    it('throws when a built-in property of an object-typed property of $nested is referenced', function(){
      (function() {
        var value = env.objValueOf.getString(ctxdata);
      }).should.throw(/valueOf is not defined on the object/);
    });
    it('throws when an object-typed property of $nested is used in an index', function(){
      (function() {
        var value = env.objIndex.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
  });
});
