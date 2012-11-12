var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;
var RetranslationManager = require('../../../lib/l20n/retranslation').RetranslationManager;
var Global = require('../../../lib/l20n/platform/globals').Global;

var parser = new Parser();
var compiler = new Compiler();

function NestedGlobal() {
  Global.call(this);
  this.id = 'nested';
  this._get = _get;

  var self = this;

  function _get() {
    return {
      property: 'property'
    }
  }
}

NestedGlobal.prototype = Object.create(Global.prototype);
NestedGlobal.prototype.constructor = NestedGlobal;
RetranslationManager.registerGlobal(NestedGlobal);

var retr = new RetranslationManager();

describe('Globals:', function(){
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
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
                         "Good morning" :
                          hour >= 12 && hour < 19 ?
                            "Good afternoon" :
                            hour >= 19 && hour < 23 ?
                              "Good evening" :
                              "Y U NO asleep?");
    });
  });

  describe('@nested.property (a dict-like global)', function(){
    before(function() {
      source = '                                                              \
        <nested "{{ @nested }}">                                              \
        <property "{{ @nested.property }}">                                   \
        <missing "{{ @nested.missing }}">                                     \
        <doubleNested "{{ @nested.property.missing }}">                       \
      ';
    });
    // XXX Bug 883270 - Compiler should handle globals and ctxdata which are not 
    // strings
    it.skip('throws when @nested is referenced', function(){
      (function() {
        var value = env.nested.getString();
      }).should.throw(Compiler.ValueError);
    });
    it('returns the correct value', function(){
      env.property.getString().should.equal('property');
    });
    it('throws when a missing property of @nested is referenced', function(){
      (function() {
        var value = env.missing.getString();
      }).should.throw(Compiler.ValueError);
      (function() {
        var value = env.missing.getString();
      }).should.throw(/is not defined/);
    });
    it('throws when a property of a primitive property of @nested is referenced', function(){
      (function() {
        var value = env.doubleNested.getString();
      }).should.throw(Compiler.ValueError);
      (function() {
        var value = env.doubleNested.getString();
      }).should.throw(/is not defined/);
    });
  });
});
