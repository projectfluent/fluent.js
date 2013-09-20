var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/compiler').Compiler :
  require('../../../lib/l20n/compiler').Compiler;
var RetranslationManager = require('../../../lib/l20n/retranslation').RetranslationManager;
var Global = require('../../../lib/l20n/platform/globals').Global;

var parser = new Parser(true);
var compiler = new Compiler();

function NestedGlobal() {
  'use strict';

  Global.call(this);
  this.id = 'nested';
  this._get = _get;

  function _get() {
    return {
      property: 'property',
      number: 1,
      bool: true,
      undef: undefined,
      nullable: null,
      arr: [3, 4],
      obj: { key: 'value' }
    };
  }
}

NestedGlobal.prototype = Object.create(Global.prototype);
NestedGlobal.prototype.constructor = NestedGlobal;
RetranslationManager.registerGlobal(NestedGlobal);

var retr = new RetranslationManager();

describe('No globals:', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var source, ast, env;
  before(function() {
    source = '                                                                \
      <theHourIs "It is {{ @hour }} o\'clock.">                               \
    ';
  });
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.compile(ast);
  });

  it('returns the current hour', function() {
    (function() {
      env.theHourIs.getString();
    }).should.throw('No globals set (tried @hour)');
  });
});


describe('Globals:', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.compile(ast);
    compiler.setGlobals(retr.globals);
  });

  describe('@hour', function(){
    before(function() {
      source = '                                                              \
        <theHourIs "It is {{ @hour }} o\'clock.">                             \
        <timeOfDay() { @hour >= 6 && @hour < 12 ?                             \
                         "morning" :                                          \
                          @hour >= 12 && @hour < 19 ?                         \
                            "afternoon" :                                     \
                            @hour >= 19 && @hour < 23 ?                       \
                              "evening" :                                     \
                              "night" }>                                      \
        <greeting[timeOfDay()] {                                              \
          morning: "Good morning",                                            \
          afternoon: "Good afternoon",                                        \
          evening: "Good evening",                                            \
          night: "Y U NO asleep?"                                             \
        }>                                                                    \
      ';
    });
    it('returns the current hour', function() {
      var value = env.theHourIs.getString();
      value.should.equal('It is ' + (new Date()).getHours() + ' o\'clock.');
    });
    it('can be used in expressions', function() {
      var value = env.greeting.getString();
      var hour = (new Date()).getHours();
      value.should.equal(hour >= 6 && hour < 12 ?
                         'Good morning' :
                          hour >= 12 && hour < 19 ?
                            'Good afternoon' :
                            hour >= 19 && hour < 23 ?
                              'Good evening' :
                              'Y U NO asleep?');
    });
  });

  describe('@nested (a dict-like global) and simple errors', function(){
    before(function() {
      source = '                                                              \
        <missing "{{ @missing }}">                                            \
        <missingTwice "{{ @missing.another }}">                               \
        <nested "{{ @nested }}">                                              \
        <nestedMissing "{{ @nested.missing }}">                               \
        <nestedMissingTwice "{{ @nested.missing.another }}">                  \
      ';
    });
    it('throws when a missing global is referenced', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/unknown global/);
    });
    it('throws when a property of a missing global is referenced', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/unknown global/);
    });
    it('throws when @nested is referenced', function(){
      (function() {
        env.nested.getString();
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
    it('throws when a missing property of @nested is referenced', function(){
      (function() {
        env.nestedMissing.getString();
      }).should.throw(/not defined/);
    });
    it('throws when a property of a missing property of @nested is referenced', function(){
      (function() {
        env.nestedMissingTwice.getString();
      }).should.throw(/not defined/);
    });
  });

  describe('@nested (a dict-like global) and strings', function(){
    before(function() {
      source = '                                                              \
        <property "{{ @nested.property }}">                                   \
        <propertyMissing "{{ @nested.property.missing }}">                    \
      ';
    });
    it('returns a string value', function(){
      env.property.getString().should.equal('property');
    });
    it('throws when a property of a string property of @nested is referenced', function(){
      (function() {
        env.propertyMissing.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
  });

  describe('@nested (a dict-like global) and numbers', function(){
    before(function() {
      source = '                                                              \
        <number "{{ @nested.number }}">                                       \
        <numberMissing "{{ @nested.number.missing }}">                        \
        <numberValueOf "{{ @nested.number.valueOf }}">                        \
        <numberIndex[@nested.number] {                                        \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('returns a number value', function(){
      env.number.getString().should.equal('1');
    });
    it('throws when a property of a number property of @nested is referenced', function(){
      (function() {
        env.numberMissing.getString();
      }).should.throw(/Cannot get property of a number: missing/);
    });
    it('throws when a built-in property of a number property of @nested is referenced', function(){
      (function() {
        env.numberMissing.getString();
      }).should.throw(/Cannot get property of a number: missing/);
    });
    it('throws when a number property of @nested is used in an index', function(){
      (function() {
        env.numberIndex.getString();
      }).should.throw(/Index must be a string/);
    });
  });

  describe('@nested (a dict-like global) and bools', function(){
    before(function() {
      source = '                                                              \
        <bool "{{ @nested.bool ? 1 : 0 }}">                                   \
        <boolMissing "{{ @nested.bool.missing }}">                            \
        <boolIndex[@nested.bool] {                                            \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('returns a bool value', function(){
      env.bool.getString().should.equal('1');
    });
    it('throws when a property of a bool property of @nested is referenced', function(){
      (function() {
        env.boolMissing.getString();
      }).should.throw(/Cannot get property of a boolean: missing/);
    });
    it('throws when a bool property of @nested is used in an index', function(){
      (function() {
        env.boolIndex.getString();
      }).should.throw(/Index must be a string/);
    });
  });

  describe('@nested (a dict-like global) and undefined', function(){
    before(function() {
      source = '                                                              \
        <undef "{{ @nested.undef }}">                                         \
        <undefMissing "{{ @nested.undef.missing }}">                          \
        <undefIndex[@nested.undef] {                                          \
          key: "value",                                                       \
          undefined: "undef"                                                  \
        }>                                                                    \
      ';
    });
    it('throws', function(){
      (function() {
        env.undef.getString();
      }).should.throw(/Placeables must be strings or numbers/);
    });
    it('throws when a property of an undefined property of @nested is referenced', function(){
      (function() {
        env.undefMissing.getString();
      }).should.throw(/Cannot get property of a undefined: missing/);
    });
    it('throws when an undefined property of @nested is used in an index', function(){
      (function() {
        env.undefIndex.getString();
      }).should.throw(/Hash key lookup failed/);
    });
  });

  describe('@nested (a dict-like global) and null', function(){
    before(function() {
      source = '                                                              \
        <nullable "{{ @nested.nullable }}">                                   \
        <nullableMissing "{{ @nested.nullable.missing }}">                    \
        <nullableIndex[@nested.nullable] {                                    \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws', function(){
      (function() {
        env.nullable.getString();
      }).should.throw(/Placeables must be strings or numbers/);
    });
    it('throws when a property of a null property of @nested is referenced', function(){
      (function() {
        env.nullableMissing.getString();
      }).should.throw(/Cannot get property of a null: missing/);
    });
    it('throws when a null property of @nested is used in an index', function(){
      (function() {
        env.nullableIndex.getString();
      }).should.throw(/Index must be a string/);
    });
  });

  describe('@nested (a dict-like global) and arrays', function(){
    before(function() {
      source = '                                                              \
        <arr "{{ @nested.arr }}">                                             \
        <arrMissing "{{ @nested.arr.missing }}">                              \
        <arrLength "{{ @nested.arr.length }}">                                \
        <arrIndex[@nested.arr] {                                              \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws', function(){
      (function() {
        env.arr.getString();
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
    it('throws when a property of an array-typed property of @nested is referenced', function(){
      (function() {
        env.arrMissing.getString();
      }).should.throw(/Cannot get property of an array: missing/);
    });
    it('throws when a built-in property of an array-typed property of @nested is referenced', function(){
      (function() {
        env.arrLength.getString();
      }).should.throw(/Cannot get property of an array: length/);
    });
    it('throws when an array-typed property of @nested is used in an index', function(){
      (function() {
        env.arrIndex.getString();
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
  });

  describe('@nested (a dict-like global) and objects', function(){
    before(function() {
      source = '                                                              \
        <obj "{{ @nested.obj }}">                                             \
        <objKey "{{ @nested.obj.key }}">                                      \
        <objMissing "{{ @nested.obj.missing }}">                              \
        <objValueOf "{{ @nested.obj.valueOf }}">                              \
        <objIndex[@nested.obj] {                                              \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws if accessed without a key', function(){
      (function() {
        env.obj.getString();
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
    it('returns a string value of the requested key', function(){
      env.objKey.getString().should.equal('value');
    });
    it('throws when a property of an object-typed property of @nested is referenced', function(){
      (function() {
        env.objMissing.getString();
      }).should.throw(/missing is not defined on the object/);
    });
    it('throws when a built-in property of an object-typed property of @nested is referenced', function(){
      (function() {
        env.objValueOf.getString();
      }).should.throw(/valueOf is not defined on the object/);
    });
    it('throws when an object-typed property of @nested is used in an index', function(){
      (function() {
        env.objIndex.getString();
      }).should.throw('Cannot resolve ctxdata or global of type object');
    });
  });
});
