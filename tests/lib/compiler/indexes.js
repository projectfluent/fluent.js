var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Index', function(){
  var source, ctxdata, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.compile(ast);
  });

  describe('IndexError in an entity in the index', function(){
    before(function() {
      source = '                                                              \
        <bar[1 - "a"] {                                                       \
         *key: "Bar"                                                          \
        }>                                                                    \
        <foo[bar] {                                                           \
         *key: "Foo"                                                          \
        }>                                                                    \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/takes two numbers/);
    });
  });

  describe('Cyclic reference to named entity', function(){
    before(function() {
      source = '                                                              \
        <foo[foo] {                                                           \
         *key: "Foo"                                                          \
        }>                                                                    \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Reference to an existing member of named entity', function(){
    before(function() {
      source = '                                                              \
        <foo[foo.bar] {                                                       \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }>                                                                    \
      ';
    });
    it('returns the value', function() {
      env.foo.getString().should.equal('Foo');
    });
  });

  describe('Cyclic reference to a missing member of named entity', function(){
    before(function() {
      source = '                                                              \
        <foo[foo.xxx] {                                                       \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }>                                                                    \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Reference to an existing attribute of named entity', function(){
    before(function() {
      source = '                                                              \
        <foo[foo::attr] {                                                     \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }                                                                     \
         attr: "key"                                                          \
        >                                                                     \
      ';
    });
    it('returns the value', function() {
      env.foo.getString().should.equal('Foo');
    });
  });

  describe('Reference to a missing attribute of named entity', function(){
    before(function() {
      source = '                                                              \
        <foo[foo::missing] {                                                  \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }                                                                     \
         attr: "key"                                                          \
        >                                                                     \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/has no attribute/);
    });
  });

  describe('Cyclic reference to this entity', function(){
    before(function() {
      source = '                                                              \
        <foo[~] {                                                             \
         *key: "Foo"                                                          \
        }>                                                                    \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Reference to an existing member of this entity', function(){
    before(function() {
      source = '                                                              \
        <foo[~.bar]   {                                                       \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }>                                                                    \
      ';
    });
    it('returns the value', function() {
      env.foo.getString().should.equal('Foo');
    });
  });

  describe('Cyclic reference to a missing member of this entity', function(){
    before(function() {
      source = '                                                              \
        <foo[~.xxx] {                                                         \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }>                                                                    \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Reference to an existing attribute of this entity', function(){
    before(function() {
      source = '                                                              \
        <foo[~::attr] {                                                       \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }                                                                     \
         attr: "key"                                                          \
        >                                                                     \
      ';
    });
    it('returns the value', function() {
      env.foo.getString().should.equal('Foo');
    });
  });

  describe('Reference to a missing attribute of this entity', function(){
    before(function() {
      source = '                                                              \
        <foo[~::missing] {                                                    \
         *key: "Foo",                                                         \
          bar: "key"                                                          \
        }                                                                     \
         attr: "key"                                                          \
        >                                                                     \
      ';
    });
    it('throws', function() {
      (function() {
        env.foo.getString();
      }).should.throw(/has no attribute/);
    });
  });

});
