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
         *baz: "Baz"                                                          \
        }>                                                                    \
                                                                              \
        <string() { "foo" }>                                                  \
        <number() { 1 }>                                                      \
        <stringEntity() { foo }>                                              \
        <hashEntity() { bar }>                                                \
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
    // XXX Bug 816887 - Macro should always return a String or a Literal
    it.skip('returns entities which are strings', function() {
      var value = env.stringEntity._call();
      value[1].should.equal('Foo');
    });
    // XXX Bug 816887 - Macro should always return a String or a Literal
    it.skip('returns resolved entities which are hashes', function() {
      var value = env.hashEntity._call();
      value[1].should.equal('Baz');
    });
  });

  describe('work with ctxdata', function(){
    before(function() {
      ctxdata = {
        n: 3
      };
      source = '                                                              \
        <identity($n) { $n }>                                                 \
        <getFromContext() { $n }>                                             \
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
    it('takes ctxdata is no args are defined', function() {
      var value = env.getFromContext._call(ctxdata, [[null, 'foo']]);
      value[1].should.equal(3);
    });
  });

});
