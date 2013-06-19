var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Attributes', function(){
  var source, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    env = compiler.reset().compile(ast);
  });

  describe('missing or invalid syntax', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo"                                                            \
         attr: "An attribute"                                                 \
        >                                                                     \
        <getAttr "{{ foo::missing }}">                                        \
        <getAttrOfAttr "{{ foo::attr::invalid }}">                            \
                                                                              \
        <bar {                                                                \
          bar: "Bar"                                                          \
        }>                                                                    \
        <getAttrOfMember "{{ bar.bar::invalid }}">                            \
      ';
    });
    // XXX Bug 884734 - Compiler: Missing attributes should fails gracefully
    it('throws if the attribute does not exist', function(){
      (function() {
        env.getAttr.getString();
      }).should.throw();
    });
    it('throws if the syntax is not valid (attr of an attr)', function(){
      (function() {
        env.getAttrOfAttr.getString();
      }).should.throw(/Malformed string/);
    });
    it('throws if the syntax is not valid (attr of a hash member)', function(){
      (function() {
        env.getAttrOfMember.getString();
      }).should.throw(/Malformed string/);
    });
  });

  describe('with string values', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo"                                                            \
         attr: "An attribute"                                                 \
         attrComplex: "An attribute of {{ foo }}"                             \
        >                                                                     \
        <getFoo "{{ foo::attr }}">                                            \
      ';
    });
    it('returns the value', function(){
      var entity = env.foo.get();
      entity.attributes.attr.should.equal("An attribute");
    });
    it('returns the value with a placeable', function(){
      var entity = env.foo.get();
      entity.attributes.attrComplex.should.equal("An attribute of Foo");
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex (simple)', function(){
      env.foo.attributes.attr.value.should.be.a('string');
    });
    it('is detected to be maybe-complex', function(){
      env.foo.attributes.attrComplex.value.should.be.a('function');
    });
    it('can be accessed from another entity ', function(){
      var value = env.getFoo.getString();
      value.should.equal("An attribute");
    });
  });

  describe('with string values', function(){
    before(function() {
      source = '                                                              \
        <foo                                                                  \
         attr: "An attribute"                                                 \
        >                                                                     \
        <getFoo "{{ foo::attr }}">                                            \
      ';
    });
    it('returns the value', function(){
      var entity = env.foo.get();
      entity.attributes.attr.should.equal("An attribute");
    });
    it('can be accessed from another entity ', function(){
      var value = env.getFoo.getString();
      value.should.equal("An attribute");
    });
  });

  describe('with hash values (no defval, no index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title: {                                                            \
            win: "Firefox for Windows",                                       \
            linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutWin "About {{ brandName::title.win }}">                         \
        <aboutMac "About {{ brandName::title.mac }}">                         \
      ';
    });
    it('throws with no property expression', function(){
      (function() {
        env.about.getString();
      }).should.throw(/Hash key lookup failed/);
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutWin.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('throws for a missing property', function(){
      (function() {
        env.aboutMac.getString();
      }).should.throw(/Hash key lookup failed/);
    });
  });

  describe('with hash values (defval, no index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title: {                                                            \
           *win: "Firefox for Windows",                                       \
            linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
      ';
    });
    it('returns the defval with no property expression', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('returns the defval for a missing property', function(){
      var value = env.aboutMac.getString();
      value.should.equal("About Firefox for Windows");
    });
  });

  describe('with hash values (no defval, index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title["win"]: {                                                     \
            win: "Firefox for Windows",                                       \
            linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
      ';
    });
    it('returns the index with no property expression', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('returns the index for a missing property', function(){
      var value = env.aboutMac.getString();
      value.should.equal("About Firefox for Windows");
    });
  });

  describe('with hash values (defval, index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title["win"]: {                                                     \
            win: "Firefox for Windows",                                       \
           *linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
      ';
    });
    it('returns the index with no property expression', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('returns the index for a missing property', function(){
      var value = env.aboutMac.getString();
      value.should.equal("About Firefox for Windows");
    });
  });

  describe('with hash values (no defval, missing key in index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title["mac"]: {                                                     \
            win: "Firefox for Windows",                                       \
            linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
      ';
    });
    it('throws with no property expression', function(){
      (function() {
        env.about.getString();
      }).should.throw(/Hash key lookup failed/);
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('throws for a missing property', function(){
      (function() {
        env.aboutMac.getString();
      }).should.throw(/Hash key lookup failed/);
    });
  });

  describe('with hash values (no defval, extra key in index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title["win", "metro"]: {                                            \
            win: "Firefox for Windows",                                       \
            linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
      ';
    });
    it('returns the index with no property expression', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('returns the index for a missing property', function(){
      var value = env.aboutMac.getString();
      value.should.equal("About Firefox for Windows");
    });
  });

  describe('with nested hash values (defval, no index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title: {                                                            \
           *win: {                                                            \
              metro: "Firefox for Windows 8",                                 \
             *other: "Firefox for Windows"                                    \
            },                                                                \
            linux: "Firefox for Linux"                                        \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutWin "About {{ brandName::title.win }}">                         \
        <aboutMetro "About {{ brandName::title.win.metro }}">                 \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
      ';
    });
    it('returns the defvals with no property expression', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('returns the second defval with one property expression', function(){
      var value = env.aboutWin.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('can have nested members accessed by another entity ', function(){
      var value = env.aboutMetro.getString();
      value.should.equal("About Firefox for Windows 8");
    });
    it('returns the defvals for a missing property', function(){
      var value = env.aboutMac.getString();
      value.should.equal("About Firefox for Windows");
    });
  });

  describe('with nested hash values (no defval, double index)', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title["win", "other"]: {                                            \
            win: {                                                            \
              metro: "Firefox for Windows 8",                                 \
              other: "Firefox for Windows"                                    \
            },                                                                \
            linux: "Firefox for Linux",                                       \
            mobile: {                                                         \
               android: "Firefox for Android",                                \
               fxos: "Firefox for Firefox OS",                                \
               other: "Firefox for Mobile"                                    \
            }                                                                 \
          }                                                                   \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
        <aboutWin "About {{ brandName::title.win }}">                         \
        <aboutMetro "About {{ brandName::title.win.metro }}">                 \
        <aboutMac "About {{ brandName::title.mac }}">                         \
        <aboutLinux "About {{ brandName::title.linux }}">                     \
        <aboutMobile "About {{ brandName::title.mobile }}">                   \
      ';
    });
    it('returns the indexed keys with no property expression', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('returns the second index with one property expression', function(){
      var value = env.aboutWin.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('can have members accessed by another entity ', function(){
      var value = env.aboutLinux.getString();
      value.should.equal("About Firefox for Linux");
    });
    it('can have nested members accessed by another entity ', function(){
      var value = env.aboutMetro.getString();
      value.should.equal("About Firefox for Windows 8");
    });
    it('returns the indexed keys for a missing property', function(){
      var value = env.aboutMac.getString();
      value.should.equal("About Firefox for Windows");
    });
    it('returns the second index with one property expression different than the first index', function(){
      var value = env.aboutMobile.getString();
      value.should.equal("About Firefox for Mobile");
    });
  });

  describe('with nested hash values (no index on attr, index on the entity)', function(){
    before(function() {
      source = '                                                              \
        <brandName["beta"] {                                                  \
          release: "Firefox",                                                 \
          beta: "Firefox Beta",                                               \
          testing: "Aurora"                                                   \
        }                                                                     \
         accesskey: {                                                         \
           release: "F",                                                      \
           beta: "B",                                                         \
           testing: "A"                                                       \
         }                                                                    \
        >                                                                     \
        <about "About {{ brandName }}">                                       \
        <press "Press {{ brandName::accesskey }}">                            \
      ';
    });
    it('returns the index of the entity', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox Beta");
    });
    it('throws because of the missing index of the attribute', function(){
      (function() {
        env.press.getString();
      }).should.throw(/Hash key lookup failed/);
    });
  });

  describe('with nested hash values (index different than the entitiy\'s)', function(){
    before(function() {
      source = '                                                              \
        <brandName["beta"] {                                                  \
          release: "Firefox",                                                 \
          beta: "Firefox Beta",                                               \
          testing: "Aurora"                                                   \
        }                                                                     \
         accesskey["testing"]: {                                              \
           release: "F",                                                      \
           beta: "B",                                                         \
           testing: "A"                                                       \
         }                                                                    \
        >                                                                     \
        <about "About {{ brandName }}">                                       \
        <press "Press {{ brandName::accesskey }}">                            \
      ';
    });
    it('returns the index of the entity', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox Beta");
    });
    it('returns the index of the attribute', function(){
      var value = env.press.getString();
      value.should.equal("Press A");
    });
  });

  describe('with relative this-references', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title: "Mozilla {{ ~ }}"                                            \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
      ';
    });
    it('returns the value', function(){
      var entity = env.brandName.get();
      entity.attributes.title.should.equal("Mozilla Firefox");
    });
    it('can be referenced from another entity', function(){
      var value = env.about.getString();
      value.should.equal("About Mozilla Firefox");
    });
  });

  describe('with relative this-references and a property expression', function(){
    before(function() {
      source = '                                                              \
        <brandName {                                                          \
         *subjective: "Firefox",                                              \
          possessive: "Firefox\'s"                                            \
        }                                                                     \
         license: "{{ ~.possessive }} license"                                \
        >                                                                     \
        <about "About {{ brandName::license }}">                              \
      ';
    });
    it('returns the value', function(){
      var entity = env.brandName.get();
      entity.attributes.license.should.equal("Firefox's license");
    });
    it('can be referenced from another entity', function(){
      var value = env.about.getString();
      value.should.equal("About Firefox's license");
    });
  });

  describe('referenced by a this-reference', function(){
    before(function() {
      source = '                                                              \
        <brandName "{{ ~::title }}"                                           \
          title: "Mozilla Firefox"                                            \
        >                                                                     \
        <about "About {{ brandName }}">                                       \
      ';
    });
    it('returns the value', function(){
      var value = env.brandName.getString();
      value.should.equal("Mozilla Firefox");
    });
    it('can be referenced from another entity', function(){
      var value = env.about.getString();
      value.should.equal("About Mozilla Firefox");
    });
  });

  describe('cyclic this-reference', function(){
    before(function() {
      source = '                                                              \
        <brandName "Firefox"                                                  \
          title: "{{ ~::title }}"                                             \
        >                                                                     \
        <about "About {{ brandName::title }}">                                \
      ';
    });
    it('throws when accessed directly', function(){
      (function() {
        env.brandName.get();
      }).should.throw(/Cyclic reference detected/);
    });
    it('throws when referenced from another entity', function(){
      (function() {
        env.about.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('complex but non-cyclic this-reference', function(){
    before(function() {
      source = '                                                              \
        <foo "Foo"                                                            \
          attr: {                                                             \
            bar: "{{ ~::attr.self }} Bar",                                    \
           *baz: "{{ ~::attr.bar }} Baz",                                     \
            self: "{{ ~ }}"                                                   \
          }                                                                   \
        >                                                                     \
        <quux "{{ foo::attr }}">                                              \
      ';
    });
    it('returns the value', function(){
      var value = env.quux.getString();
      value.should.equal("Foo Bar Baz");
    });
  });

});
