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

  describe('Errors', function(){
    before(function() {
      ctxdata = {
        nested: {
          property: 'property'
        }
      };
      source = '                                                              \
        <missing "{{ $missing }}">                                            \
        <nested "{{ $nested }}">                                              \
        <property "{{ $nested.property }}">                                   \
        <missingProperty "{{ $nested.missing }}">                             \
        <doubleNested "{{ $nested.property.missing }}">                       \
      ';
    });
    it('throws when a missing variable is referenced', function(){
      (function() {
        var value = env.missing.getString(ctxdata);
      }).should.throw(Compiler.ValueError);
      (function() {
        var value = env.missing.getString(ctxdata);
      }).should.throw(/unknown variable/);
    });
    // XXX Bug 883270 - Compiler should handle globals and ctxdata which are not 
    // strings
    it.skip('throws when $nested alone is referenced', function(){
      (function() {
        var value = env.nested.getString(ctxdata);
      }).should.throw(Compiler.ValueError);
    });
    it('returns the correct value for $nested.property', function(){
      env.property.getString(ctxdata).should.equal('property');
    });
    it('throws when a missing property of $nested is referenced', function(){
      (function() {
        var value = env.missingProperty.getString(ctxdata);
      }).should.throw(Compiler.ValueError);
      (function() {
        var value = env.missingProperty.getString(ctxdata);
      }).should.throw(/is not defined/);
    });
    it('throws when a property of a primitive property of $nested is referenced', function(){
      (function() {
        var value = env.doubleNested.getString(ctxdata);
      }).should.throw(Compiler.ValueError);
      (function() {
        var value = env.doubleNested.getString(ctxdata);
      }).should.throw(/is not defined/);
    });
  });
});
