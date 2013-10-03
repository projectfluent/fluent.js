var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/compiler').Compiler :
  require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser(true);
var compiler = new Compiler();

describe('Primitives:', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.compile(ast);
  });

  describe('Numbers', function(){
    before(function() {
      source = '                                                              \
        <one "{{ 1 }}">                                                       \
        <missing "{{ 1.missing }} ">                                          \
        <builtin "{{ 1.valueOf }} ">                                          \
        <index[1] {                                                           \
          key: "value"                                                        \
        }>                                                                    \
        <indexMissing[1.missing] {                                            \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('returns the value in the placeable', function(){
      env.one.getString().should.equal('1');
    });
    it('throws when trying to access a property of a number', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/Cannot get property of a number: missing/);
    });
    it('throws when trying to access a builtin property of a number', function(){
      (function() {
        env.builtin.getString();
      }).should.throw(/Cannot get property of a number: valueOf/);
    });
    it('throws when in index', function(){
      (function() {
        env.index.getString();
      }).should.throw(/Index must be a string/);
    });
    it('throws when trying to access a property of a number in an index', function(){
      (function() {
        env.indexMissing.getString();
      }).should.throw(/Cannot get property of a number: missing/);
    });
  });

  describe('Booleans', function(){
    before(function() {
      source = '                                                              \
        <true "{{ 1 == 1 }} ">                                                \
        <missing "{{ (1 == 1).missing }} ">                                   \
        <builtin "{{ (1 == 1).valueOf }} ">                                   \
        <index[(1 == 1)] {                                                    \
          key: "value"                                                        \
        }>                                                                    \
        <indexMissing[(1 == 1).missing] {                                     \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('throws when used in a complex string', function(){
      (function() {
        env.true.getString();
      }).should.throw(/Placeables must be strings or numbers/);
    });
    it('throws when trying to access a property of a number', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/Cannot get property of a boolean: missing/);
    });
    it('throws when trying to access a builtin property of a number', function(){
      (function() {
        env.builtin.getString();
      }).should.throw(/Cannot get property of a boolean: valueOf/);
    });
    it('throws when in index', function(){
      (function() {
        env.index.getString();
      }).should.throw(/Index must be a string/);
    });
    it('throws when trying to access a property of a number in an index', function(){
      (function() {
        env.indexMissing.getString();
      }).should.throw(/Cannot get property of a boolean: missing/);
    });
  });

  describe('Simple string value', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
        <fooMissing "{{ foo.missing }} ">                                     \
        <fooLength "{{ foo.length }} ">                                       \
        <literalMissing "{{ \'string\'.missing }} ">                          \
        <literalLength "{{ \'string\'.length }} ">                            \
        <literalIndex["string".missing] {                                     \
          key: "value"                                                        \
        }>                                                                    \
      ';
    });
    it('returns the value', function(){
      var value = env.foo.getString();
      value.should.equal('Foo');
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex', function(){
      env.foo.value.should.be.a('string');
    });
    it('throws when trying to access a property of a string', function(){
      (function() {
        env.fooMissing.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
    it('throws when trying to access a builtin property of a string', function(){
      (function() {
        env.fooLength.getString();
      }).should.throw(/Cannot get property of a string: length/);
    });
    it('throws when trying to access a property of a string literal', function(){
      (function() {
        env.literalMissing.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
    it('throws when trying to access a builtin property of a string literal', function(){
      (function() {
        env.literalLength.getString();
      }).should.throw(/Cannot get property of a string: length/);
    });
    it('throws when trying to access a property of a string literal in an index', function(){
      (function() {
        env.literalIndex.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
  });

  describe('Complex string value', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo">                                                           \
        <bar "{{ foo }} Bar">                                                 \
        <barMissing "{{ bar.missing }} ">                                     \
        <barLength "{{ bar.length }} ">                                       \
        <baz "{{ missing }}">                                                 \
        <quux "{{ foo.missing }} ">                                           \
      ';
    });
    it('returns the value', function(){
      var value = env.bar.getString();
      value.should.equal('Foo Bar');
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be complex', function(){
      env.bar.value.should.be.a('function');
    });
    it('throws when the referenced entity cannot be found', function(){
      (function() {
        env.baz.getString();
      }).should.throw(/unknown entry/);
    });
    it('throws when trying to access a property of a string', function(){
      (function() {
        env.quux.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
  });

  describe('String value in a hash', function(){
    before(function() {
      source = '                                                              \
        <foo {                                                                \
          key: "Foo"                                                          \
        }>                                                                    \
        <bar "{{ foo.key }}">                                                 \
        <missing "{{ foo.key.missing }}">                                     \
        <undef "{{ foo.key[$undef] }}">                                       \
      ';
    });
    it('returns the value', function(){
      var value = env.bar.getString();
      value.should.equal('Foo');
    });
    it('is not detected to be non-complex', function(){
      env.bar.value.should.be.a('function');
    });
    it('throws when trying to access a property of a string member', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/Cannot get property of a string: missing/);
    });
    // see Compiler:StringLiteral
    it('throws when trying to access an "undefined" property of a string member', function(){
      (function() {
        env.undef.getString({ undef: undefined });
      }).should.throw(/Cannot get property of a string: undefined/);
    });
  });
  
  describe('Complex string referencing an entity with null value', function(){
    before(function() {
      source = '                                                              \
        <foo                                                                  \
          attr: "Foo"                                                         \
        >                                                                     \
        <bar "{{ foo }} Bar">                                                 \
        <baz "{{ foo::attr }} Bar">                                           \
      ';
    });
    it('returns the null value', function(){
      var entity = env.foo.get();
      entity.should.have.property('value', null);
    });
    it('throws when the referenced entity has null value', function(){
      (function() {
        env.bar.getString();
      }).should.throw(/Placeables must be strings or numbers/);
    });
    it('returns the attribute', function(){
      var value = env.baz.getString();
      value.should.equal('Foo Bar');
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
      value.should.equal('Bar');
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex', function(){
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
      value.should.equal('Bar');
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
      value.should.equal('Bar');
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
      value.should.equal('Bar');
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal('Bar');
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
      value.should.equal('Bar');
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
      value.should.equal('Bar');
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
      value.should.equal('Bar');
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString();
      value.should.equal('Bar');
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
