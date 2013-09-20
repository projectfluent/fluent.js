var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/compiler').Compiler :
  require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Hash', function() {
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

  describe('without index nor default value', function(){
    before(function() {
      source = '                                                              \
        <brandName {                                                          \
          masculine: "Firefox",                                               \
          feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('throws when called directly', function(){
      (function() {
        env.brandName.getString();
      }).should.throw(Compiler.IndexError);
    });
    it('throws when called from another entity', function(){
      (function() {
        env.plain.getString();
      }).should.throw(Compiler.ValueError);
      try {
        env.plain.getString();
      } catch (e) {
        e.should.have.property('source', '{{ brandName }}');
      }
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('throws when requested property does not exist', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/Hash key lookup failed/);
    });
    it('throws when accessing a property of missing property', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Hash key lookup failed/);
    });
  });

  describe('with index but no default value', function(){
    before(function() {
      source = '                                                              \
        <brandName["feminine"] {                                              \
          masculine: "Firefox",                                               \
          feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('returns the indexed property when called directly', function(){
      var val = env.brandName.getString();
      val.should.equal('Aurora');
    });
    // Bug 803627 - Compiler: entity's index is empty if you call 
    // entity.getString() a second time
    it('returns the indexed property when called directly twice', function(){
      var val = env.brandName.getString();
      val = env.brandName.getString();
      val.should.equal('Aurora');
    });
    it('returns the indexed property when referenced in another entity', function(){
      var val = env.plain.getString();
      val.should.equal('Aurora');
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('returns the indexed property when the requested one does not exist', function(){
      var val = env.missing.getString();
      val.should.equal('Aurora');
    });
    it('throws when trying to access a property of a string-typed member', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Cannot get property of a string: another/);
    });
  });

  describe('without index but with a default value', function(){
    before(function() {
      source = '                                                              \
        <brandName {                                                          \
          masculine: "Firefox",                                               \
         *feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('returns the default property when called directly', function(){
      var val = env.brandName.getString();
      val.should.equal('Aurora');
    });
    it('returns the default property when referenced in another entity', function(){
      var val = env.plain.getString();
      val.should.equal('Aurora');
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('returns the default property when the requested one does not exist', function(){
      var val = env.missing.getString();
      val.should.equal('Aurora');
    });
    it('throws when trying to access a property of a string-typed member', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Cannot get property of a string: another/);
    });
  });

  describe('with index and with a default value', function(){
    before(function() {
      source = '                                                              \
        <brandName["feminine"] {                                              \
         *masculine: "Firefox",                                               \
          feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('returns the indexed property when called directly', function(){
      var val = env.brandName.getString();
      val.should.equal('Aurora');
    });
    it('returns the indexed property when referenced in another entity', function(){
      var val = env.plain.getString();
      val.should.equal('Aurora');
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('returns the indexed property when the requested one does not exist', function(){
      var val = env.missing.getString();
      val.should.equal('Aurora');
    });
    it('throws when trying to access a property of a string-typed member', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Cannot get property of a string: another/);
    });
  });

  describe('with an extra index and without default value', function(){
    before(function() {
      source = '                                                              \
        <brandName["feminine", "foo"] {                                       \
          masculine: "Firefox",                                               \
          feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('returns the indexed property when called directly', function(){
      var val = env.brandName.getString();
      val.should.equal('Aurora');
    });
    it('returns the indexed property when referenced in another entity', function(){
      var val = env.plain.getString();
      val.should.equal('Aurora');
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('returns the indexed property when the requested one does not exist', function(){
      var val = env.missing.getString();
      val.should.equal('Aurora');
    });
    it('throws when trying to access a property of a string-typed member', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Cannot get property of a string: another/);
    });
  });

  describe('with a valid but non-matching index and without default value', function(){
    before(function() {
      source = '                                                              \
        <brandName["foo"] {                                                   \
          masculine: "Firefox",                                               \
          feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('throws when called directly', function(){
      (function() {
        env.brandName.getString();
      }).should.throw(Compiler.IndexError);
    });
    it('throws when called from another entity', function(){
      (function() {
        env.plain.getString();
      }).should.throw(Compiler.ValueError);
      try {
        env.plain.getString();
      } catch (e) {
        e.should.have.property('source', '{{ brandName }}');
      }
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('throws when requested property does not exist', function(){
      (function() {
        env.missing.getString();
      }).should.throw('Hash key lookup failed (tried "missing", "foo").');
    });
    it('throws when trying to access a property of a missing member', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw('Hash key lookup failed (tried "missing", "foo").');
    });
  });

  describe('with a valid but non-matching index and with default value', function(){
    before(function() {
      source = '                                                              \
        <brandName["foo"] {                                                   \
          masculine: "Firefox",                                               \
         *feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('returns the default property when called directly', function(){
      var val = env.brandName.getString();
      val.should.equal('Aurora');
    });
    it('returns the default property when referenced in another entity', function(){
      var val = env.plain.getString();
      val.should.equal('Aurora');
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('returns the default property when the requested one does not exist', function(){
      var val = env.missing.getString();
      val.should.equal('Aurora');
    });
    it('throws when trying to access a property of a string-typed member', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Cannot get property of a string: another/);
    });
  });

  describe('with an invalid index and without default value', function(){
    before(function() {
      source = '                                                              \
        <brandName[foo] {                                                     \
          masculine: "Firefox",                                               \
          feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('throws when called directly', function(){
      (function() {
        env.brandName.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.brandName.getString();
      }).should.throw(/Reference to an unknown entry/);
    });
    it('throws when called from another entity', function(){
      (function() {
        env.plain.getString();
      }).should.throw(Compiler.ValueError);
      try {
        env.plain.getString();
      } catch (e) {
        e.should.have.property('source', '{{ brandName }}');
      }
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('throws when requested property does not exist', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/Reference to an unknown entry/);
    });
    it('throws when trying to access a property of a missing property', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Reference to an unknown entry/);
    });
  });

  describe('with an invalid index and with default value', function(){
    before(function() {
      source = '                                                              \
        <brandName[foo] {                                                     \
          masculine: "Firefox",                                               \
         *feminine: "Aurora"                                                  \
        }>                                                                    \
        <plain "{{ brandName }}">                                             \
        <property "{{ brandName.masculine }}">                                \
        <computed "{{ brandName[\\"masculine\\"] }}">                         \
        <missing "{{ brandName.missing }}">                                   \
        <missingTwice "{{ brandName.missing.another }}">                      \
      ';
    });
    it('throws when called directly', function(){
      (function() {
        env.brandName.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.brandName.getString();
      }).should.throw(/Reference to an unknown entry/);
    });
    it('throws when called from another entity', function(){
      (function() {
        env.plain.getString();
      }).should.throw(Compiler.ValueError);
      try {
        env.plain.getString();
      } catch (e) {
        e.should.have.property('source', '{{ brandName }}');
      }
    });
    it('returns the requested property', function(){
      var val = env.property.getString();
      val.should.equal('Firefox');
    });
    it('returns the requested computed property', function(){
      var val = env.computed.getString();
      val.should.equal('Firefox');
    });
    it('throws when requested property does not exist', function(){
      (function() {
        env.missing.getString();
      }).should.throw(/Reference to an unknown entry/);
    });
    it('throws when trying to access a property of a missing property', function(){
      (function() {
        env.missingTwice.getString();
      }).should.throw(/Reference to an unknown entry/);
    });
  });

  describe('and built-in properties', function(){
    before(function() {
      source = '                                                              \
        <bar {                                                                \
         *key: "Bar"                                                          \
        }>                                                                    \
        <foo "{{ bar.length }}">                                              \
      ';
    });
    it('returns the default member', function(){
      var val = env.foo.getString();
      val.should.equal('Bar');
    });
  });

});
