var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Compiler errors:', function(){
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
  });

  describe('A complex string referencing an existing entity', function(){
    before(function() {
      source = '                                                              \
        <_file "file">                                                        \
        <prompt["remove"] {                                                   \
          remove: "Remove {{ _file }}?",                                      \
          keep: "Keep {{ _file }}?"                                           \
        }>                                                                    \
      ';
    });
    it('works with the default index', function(){
      env.prompt.getString().should.equal("Remove file?");
    });
  });
  describe('A complex string referencing a missing entity', function(){
    before(function() {
      source = '                                                              \
        <prompt["remove"] {                                                   \
          remove: "Remove {{ _file }}?",                                      \
          keep: "Keep {{ _file }}?"                                           \
        }>                                                                    \
      ';
    });
    it('throws a ValueError', function(){
      (function() {
        env.prompt.getString();
      }).should.throw(Compiler.ValueError);
      (function() {
        env.prompt.getString();
      }).should.throw(/unknown entry/);
    });
    it('provides the source of the string in the ValueError', function(){
      try {
        env.prompt.getString();
      } catch (e) {
        e.should.have.property('source', 'Remove {{ _file }}?');
      }
    });
  });
  describe('An existing entity in the index', function(){
    before(function() {
      source = '                                                              \
        <_keep "keep">                                                        \
        <prompt[_keep] {                                                      \
          remove: "Remove file?",                                             \
          keep: "Keep file?"                                                  \
        }>                                                                    \
        <bypass "{{ prompt.remove }}">                                        \
      ';
    });
    it('is found', function(){
      env.prompt.getString().should.equal("Keep file?");
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Remove file?");
    });
  });
  describe('A missing entity in the index', function(){
    before(function() {
      source = '                                                              \
        <prompt[_keep] {                                                      \
          remove: "Remove file?",                                             \
          keep: "Keep file?"                                                  \
        }>                                                                    \
        <bypass "{{prompt.remove}}">                                          \
      ';
    });
    it('throws an IndexError', function(){
      (function() {
        env.prompt.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.prompt.getString();
      }).should.throw(/unknown entry/);
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Remove file?");
    });
  });
  describe('A complex string referencing an existing entity in the index', function(){
    before(function() {
      source = '                                                              \
        <_keep "keep">                                                        \
        <prompt["{{ _keep }}"] {                                              \
          remove: "Remove file?",                                             \
          keep: "Keep file?"                                                  \
        }>                                                                    \
        <bypass "{{ prompt.remove }}">                                        \
      ';
    });
    it('works', function(){
      env.prompt.getString().should.equal("Keep file?");
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Remove file?");
    });
  });
  describe('A complex string referencing a missing entity in the index', function(){
    before(function() {
      source = '                                                              \
        <prompt["{{ _keep }}"] {                                              \
          remove: "Remove file?",                                             \
          keep: "Keep file?"                                                  \
        }>                                                                    \
        <bypass "{{ prompt.remove }}">                                        \
      ';
    });
    it('throws an IndexError, not a ValueError', function(){
      (function() {
        env.prompt.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.prompt.getString();
      }).should.throw(/unknown entry/);
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Remove file?");
    });
  });


  // Member look-up order: property, default value
  
  describe('No index, with a default value set', function(){
    before(function() {
      source = '                                                              \
        <settings {                                                           \
          win: "Options",                                                     \
         *other: "Preferences"                                                \
        }>                                                                    \
        <bypass "{{ settings.win }}">                                         \
        <bypassNoKey "{{ settings.lin }}">                                    \
      ';
    });
    it('uses the default value', function(){
      env.settings.getString().should.equal("Preferences");
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Options");
    });
    it('if a property expression fails, uses the default value', function(){
      env.bypassNoKey.getString().should.equal("Preferences");
    });
  });
  describe('No index, without a default value set', function(){
    before(function() {
      source = '                                                              \
        <settings {                                                           \
          win: "Options",                                                     \
          other: "Preferences"                                                \
        }>                                                                    \
        <bypass "{{ settings.win }}">                                         \
        <bypassNoKey "{{ settings.lin }}">                                    \
      ';
    });
    it('throws an IndexError', function(){
      (function() {
        env.settings.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.settings.getString();
      }).should.throw('Hash key lookup failed.');
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Options");
    });
    it('if a property expression fails, throws an IndexError', function(){
      (function() {
        // This will actually throw a ValueError, not IndexError, because we're 
        // asking for `bypassNoKey`, not `settings` directly.  There is no API 
        // to directly request a member of a hash value of an entity.  The way 
        // we know this test works is by checking the message of the error.
        env.bypassNoKey.getString();
      }).should.throw(Compiler.ValueError);
      (function() {
        env.bypassNoKey.getString();
      }).should.throw('Hash key lookup failed (tried "lin").');
    });
  });


  // Member look-up order: property, index, default value

  describe('A valid reference in the index, with a default value set', function(){
    before(function() {
      source = '                                                              \
        /* this would normally be a global, @os, not a variable */            \
        <settings[$os] {                                                      \
          win: "Options",                                                     \
         *other: "Preferences"                                                \
        }>                                                                    \
        <bypass "{{ settings.win }}">                                         \
        <bypassNoKey "{{ settings.lin }}">                                    \
      ';
    });
    it('selects the right key', function(){
      env.settings.getString({os: "win"}).should.equal("Options");
    });
    it('falls back to the default value if the key is not found', function(){
      env.settings.getString({os: "mac"}).should.equal("Preferences");
    });
    it('can be bypassed', function(){
      env.bypass.getString({os: "mac"}).should.equal("Options");
    });
    it('if a property expression fails, uses the index', function(){
      env.bypassNoKey.getString({os: "win"}).should.equal("Options");
    });
    it('if a property expression and index lookup fails, uses the default value', function(){
      env.bypassNoKey.getString({os: "mac"}).should.equal("Preferences");
    });
  });
  describe('An invalid reference in the index, with a default value set', function(){
    before(function() {
      source = '                                                              \
        /* this would normally be a global, @os, not a variable */            \
        <settings[$os] {                                                      \
          win: "Options",                                                     \
         *other: "Preferences"                                                \
        }>                                                                    \
        <bypass "{{ settings.win }}">                                         \
        <bypassNoKey "{{ settings.lin }}">                                    \
      ';
    });
    it('throws an IndexError instead of returning the default value', function(){
      (function() {
        env.settings.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.settings.getString();
      }).should.throw(/unknown variable/);
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Options");
    });
    it('if a property expression fails, throws an IndexError', function(){
      (function() {
        // This will actually throw a ValueError, not IndexError.  See above.
        env.bypassNoKey.getString();
      }).should.throw(Compiler.ValueError);
      (function() {
        env.bypassNoKey.getString();
      }).should.throw(/unknown variable/);
    });
  });
  describe('A valid reference in the index, without a default value', function(){
    before(function() {
      source = '                                                              \
        /* this would normally be a global, @os, not a variable */            \
        <settings[$os] {                                                      \
          win: "Options",                                                     \
          other: "Preferences"                                                \
        }>                                                                    \
        <bypass "{{ settings.win }}">                                         \
        <bypassNoKey "{{ settings.lin }}">                                    \
      ';
    });
    it('selects the right key', function(){
      env.settings.getString({os: "win"}).should.equal("Options");
    });
    it('throws an IndexError instead of returning the default value', function(){
      (function() {
        env.settings.getString({os: "mac"});
      }).should.throw(Compiler.IndexError);
      (function() {
        env.settings.getString({os: "mac"});
      }).should.throw(/Hash key lookup failed/);
    });
    it('can be bypassed', function(){
      env.bypass.getString({os: "mac"}).should.equal("Options");
    });
    it('if a property expression fails, uses the index', function(){
      env.bypassNoKey.getString({os: "win"}).should.equal("Options");
    });
    it('if a property expression fails and index lookup fails, throws an IndexError', function(){
      (function() {
        // This will actually throw a ValueError, not IndexError.  See above.
        env.bypassNoKey.getString({os: "mac"});
      }).should.throw(Compiler.ValueError);
      (function() {
        env.bypassNoKey.getString({os: "mac"});
      }).should.throw('Hash key lookup failed (tried "lin", "mac").');
    });
  });
  describe('An invalid reference in the index, without a default value', function(){
    before(function() {
      source = '                                                              \
        /* this would normally be a global, @os, not a variable */            \
        <settings[$os] {                                                      \
          win: "Options",                                                     \
          other: "Preferences"                                                \
        }>                                                                    \
        <bypass "{{ settings.win }}">                                         \
        <bypassNoKey "{{ settings.lin }}">                                    \
      ';
    });
    it('throws an IndexError instead of returning the default value', function(){
      (function() {
        env.settings.getString();
      }).should.throw(Compiler.IndexError);
      (function() {
        env.settings.getString();
      }).should.throw(/unknown variable/);
    });
    it('can be bypassed', function(){
      env.bypass.getString().should.equal("Options");
    });
    it('if a property expression fails, throws an IndexError', function(){
      (function() {
        // This will actually throw a ValueError, not IndexError.  See above.
        env.bypassNoKey.getString();
      }).should.throw(Compiler.ValueError);
      (function() {
        env.bypassNoKey.getString();
      }).should.throw(/unknown variable/);
    });
  });
});

