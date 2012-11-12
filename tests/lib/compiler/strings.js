var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Strings:', function(){
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
  });

  describe('Simple string value', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
      ';
    });
    it('returns the value', function(){
      var value = env.foo.getString();
      value.should.equal("Foo");
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex (simple)', function(){
      env.foo.value.should.be.a('string');
    });
  });

  describe('Complex string value', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
        <bar "{{ foo }} Bar">                                                 \
        <baz "{{ quux }}">                                                    \
      ';
    });
    it('returns the value', function(){
      var value = env.bar.getString();
      value.should.equal("Foo Bar");
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex (simple)', function(){
      env.bar.value.should.be.a('function');
    });
    it('throws when the referenced entity cannot be found', function(){
      (function() {
        env.baz.getString();
      }).should.throw(/unknown entry/);
    });
  });
  
  // XXX Bug 884544 - Compiler: isNotComplex doesn't work for entities with 
  // null values 
  describe.skip('Complex string value with errors', function(){
    before(function() {
      source = '                                                              \
        <foo                                                                  \
          attr: "Foo"                                                         \
        >                                                                     \
        <bar "{{ foo }} Bar">                                                 \
        <baz "{{ foo::missing }} Bar">                                        \
      ';
    });
    it('returns the value', function(){
      var entity = env.foo.get();
      entity.should.have.property('value', null);
    });
    it('throws when the referenced entity has null value', function(){
      (function() {
        env.bar.getString();
      }).should.throw(/Placeables must be strings or numbers/);
    });
    // XXX Bug 884734 - Compiler: Missing attributes should fail gracefully 
    it('throws when referencing a missing attribute', function(){
      (function() {
        env.baz.getString();
      }).should.throw();
    });
  });

  describe('This-reference', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ ~.bar }}",                                                 \
          bar: "Bar"                                                          \
        }>                                                                    \
      ';
    });
    it('returns the value', function(){
      var value = env.foo.getString();
      value.should.equal("Bar");
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex (simple)', function(){
      env.foo.value.should.be.a('function');
    });
  });

  describe('Cyclic reference', function(){
    before(function() {
      source = '                                                              \
        <foo "{{ bar }}">                                                     \
        <bar "{{ foo }}">                                                     \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Cyclic self-reference', function(){
    before(function() {
      source = '                                                              \
        <foo "{{ foo }}">                                                     \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Cyclic self-reference in a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ foo }}",                                                   \
          bar: "Bar"                                                          \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal("Bar");
    });
  });

  describe('Cyclic self-reference to a property of a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ foo.foo }}",                                               \
          bar: "Bar"                                                          \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal("Bar");
    });
  });

  describe('Non-cyclic self-reference to a property of a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ foo.bar }}",                                               \
          bar: "Bar"                                                          \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('returns the value', function(){
      var value = env.foo.getString();
      value.should.equal("Bar");
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal("Bar");
    });
  });

  describe('Cyclic self-reference to a property of a hash which references self', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ foo.bar }}",                                               \
          bar: "{{ foo }}"                                                    \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
    it('throws', function(){
      (function() {
        env.bar.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Cyclic this-reference', function(){
    before(function() {
      source = '                                                              \
        <foo "{{ ~ }}">                                                       \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Cyclic this-reference in a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ ~ }}",                                                     \
          bar: "Bar"                                                          \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal("Bar");
    });
  });

  describe('Cyclic this-reference to a property of a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ ~.foo }}",                                                 \
          bar: "Bar"                                                          \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal("Bar");
    });
  });

  describe('Non-cyclic this-reference to a property of a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ ~.bar }}",                                                 \
          bar: "Bar"                                                          \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('returns the valid value if requested directly', function(){
      var value = env.foo.getString();
      value.should.equal("Bar");
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal("Bar");
    });
  });

  describe('Cyclic this-reference to a property of a hash which references this', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
         *foo: "{{ ~.bar }}",                                                 \
          bar: "{{ ~ }}"                                                      \
        }>                                                                    \
        <bar "{{ foo.bar }}">                                                 \
      ';
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
    it('throws', function(){
      (function() {
        env.bar.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

});
