var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Macros', function(){
  var source, ctxdata, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
  });

  describe('arguments', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
        <bar {                                                                \
          baz: "Baz"                                                          \
        }>                                                                    \
                                                                              \
        <identity($n) { $n }>                                                 \
        <getBaz($n) { $n.baz }>                                               \
        <say() { "Hello" }>                                                   \
        <call($n) { $n() }>                                                   \
        <callWithArg($n, $arg) { $n($arg) }>                                  \
                                                                              \
        <noArg "{{ identity() }}">                                            \
        <stringArg "{{ identity(\'string\') }}">                              \
        <numberArg "{{ identity(1) }}">                                       \
        <entityArg "{{ identity(foo) }}">                                     \
        <entityReferenceArg "{{ getBaz(bar) }}">                              \
        <macroArg "{{ identity(say) }}">                                      \
        <callMacro "{{ call(say) }}">                                         \
        <callMacroWithArg "{{ callWithArg(identity, 2) }}">                   \
      ';
    });
    // XXX Bug 884201 - Compiler: macros should fail gracefully if no required 
    // arguments are passed 
    it.skip('throws if no required args are provided', function() {
      (function() {
        env.noArg.getString();
      }).should.throw(Compiler.ValueError);
    });
    it('strings are passed correctly', function() {
      var value = env.stringArg.getString();
      value.should.equal('string');
    });
    it('numbers are passed correctly', function() {
      var value = env.numberArg.getString();
      value.should.equal('1');
    });
    it('entities are passed by reference', function() {
      var value = env.entityArg.getString();
      value.should.equal('Foo');
    });
    it('entities are passed by reference', function() {
      var value = env.entityReferenceArg.getString();
      value.should.equal('Baz');
    });
    it('macro references are passed correctly', function() {
      var value = env.callMacro.getString();
      value.should.equal('Hello');
    });
    it('macro references and their args are passed correctly', function() {
      var value = env.callMacroWithArg.getString();
      value.should.equal('2');
    });
  });

  describe('return values', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
        <bar {                                                                \
         *bar: "Bar",                                                         \
          baz: "Baz"                                                          \
        }>                                                                    \
                                                                              \
        <string() { "foo" }>                                                  \
        <number() { 1 }>                                                      \
        <stringEntity() { foo }>                                              \
        <hashEntity() { bar }>                                                \
                                                                              \
        <stringMissingProp "{{ stringEntity().missing }}">                    \
        <stringMissingAttr "{{ (stringEntity())::missing }}">                 \
        <hashBazProp "{{ hashEntity().baz }}">                                \
        <hashMissingProp "{{ hashEntity().missing }}">                        \
        <hashMissingAttr "{{ (stringEntity())::missing }}">                   \
      ';
    });
    it('returns strings', function() {
      var value = env.string._call();
      value[1].should.equal('foo');
    });
    it('returns numbers', function() {
      var value = env.number._call();
      value[1].should.equal(1);
    });
    it('returns entities which are strings', function() {
      var value = env.stringEntity._call();
      value[1].should.equal('Foo');
    });
    it('returns resolved entities which are hashes', function() {
      var value = env.hashEntity._call();
      value[1].should.equal('Bar');
    });
    it('throws when trying to access a property of macro\'s return value', function() {
      (function() {
        env.stringMissingProp.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
    // XXX Bug 884734 - Compiler: Missing attributes should fails gracefully
    it.skip('throws when trying to access an attribute of macro\'s return value', function() {
      (function() {
        env.stringMissingAttr.getString();
      }).should.throw();
    });

    it('resolves the hash and throws when trying to access a property of macro\'s return value', function() {
      (function() {
        env.hashBazProp.getString();
      }).should.throw(/Cannot get property of a string: baz/);
    });
    it('resolves the hash and throws when trying to access a missing property of macro\'s return value', function() {
      (function() {
        env.hashMissingProp.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
    // XXX Bug 884734 - Compiler: Missing attributes should fails gracefully
    it.skip('resolves the hash and throws when trying to access an attribute of macro\'s return value', function() {
      (function() {
        env.hashMissingAttr.getString();
      }).should.throw();
    });
  });

  describe('and ctxdata:', function(){
    before(function() {
      ctxdata = {
        n: 3
      };
      source = '                                                              \
        <identity($n) { $n }>                                                 \
        <getFromContext() { $n }>                                             \
                                                                              \
        <foo "{{ $n }}">                                                      \
        <bar {                                                                \
         *key: "{{ $n }}",                                                    \
        }>                                                                    \
                                                                              \
        <getFoo($n) { foo }>                                                  \
        <getBar($n) { bar }>                                                  \
        <getBarKey($n) { bar.key }>                                           \
      ';
    });
    it('does not look at ctxdata if the arg is passed', function() {
      var value = env.identity._call(ctxdata, [[null, 'foo']]);
      value[1].should.equal('foo');
    });
    // XXX Bug 884201 - Compiler: macros should fail gracefully if no required 
    // arguments are passed 
    it.skip('does not look at ctxdata if the arg is defined, but is not passed', function() {
      var value = env.identity._call(ctxdata);
      value[1].should.equal(3);
    });
    it('takes ctxdata if no args are defined', function() {
      var value = env.getFromContext._call(ctxdata, [[null, 'foo']]);
      value[1].should.equal(3);
    });
    it('does not leak args into string entities', function() {
      var value = env.getFoo._call(ctxdata, [[null, 'foo']]);
      value[1].should.equal('3');
    });
    it('does not leak args into hash entities', function() {
      var value = env.getBar._call(ctxdata, [[null, 'foo']]);
      value[1].should.equal('3');
    });
    it('does not leak args into members of hash entities', function() {
      var value = env.getBarKey._call(ctxdata, [[null, 'foo']]);
      value[1].should.equal('3');
    });
  });

});
