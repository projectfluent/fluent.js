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
    ast.body['plural'] = {
      type: 'Macro',
      args: [{
        type: 'Identifier',
        name: 'n'
      }],
      expression: function(n) {
        return (n == 1) ? 'one' : 'other';
      }
    };
    env = compiler.compile(ast);
  });

  describe('with string values', function(){
    before(function() {
      source = [
        'foo=Foo',
        'foo.attr=An attribute',
        'foo.attrComplex=An attribute referencing {{ bar }}',
        'bar=Bar'
      ].join('\n');
    });
    it('returns the value', function(){
      var entity = env.foo.get();
      entity.attributes.attr.should.equal("An attribute");
    });
    it('returns the value with a placeable', function(){
      var entity = env.foo.get();
      entity.attributes.attrComplex.should.equal("An attribute referencing Bar");
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be non-complex (simple)', function(){
      env.foo.attributes.attr.value.should.be.a('string');
    });
    it('is detected to be maybe-complex', function(){
      env.foo.attributes.attrComplex.value.should.be.a('function');
    });
  });

  describe('with hash values', function(){
    before(function() {
      source = [
        'update=Update',
        'update.innerHTML={[ plural(n) ]}',
        'update.innerHTML[one]=One update available'
      ].join('\n');
    });
    it('returns the value of the entity', function(){
      var value = env.update.getString();
      value.should.equal("Update");
    });
    it('returns the value of the attribute\'s member', function(){
      var entity = env.update.get({n: 1});
      entity.attributes.innerHTML.should.equal("One update available");
    });
  });


  describe('with hash values, on entities with hash values ', function(){
    before(function() {
      source = [
        'update={[ plural(n) ]}',
        'update[one]=One update',
        'update[other]={{ n }} updates',
        'update.innerHTML={[ plural(k) ]}',
        'update.innerHTML[one]=One update innerHTML',
        'update.innerHTML[other]={{ k }} updates innerHTML'
      ].join('\n');
    });
    it('returns the value of the entity', function(){
      var entity = env.update.get({n: 1, k: 2});
      entity.value.should.equal("One update");
    });
    it('returns the value of the attribute', function(){
      var entity = env.update.get({n: 1, k: 2});
      entity.attributes.innerHTML.should.equal("2 updates innerHTML");
    });
  });

  describe('with relative self-references', function(){
    before(function() {
      source = [
        'brandName=Firefox',
        'brandName.title=Mozilla {{ brandName }}'
      ].join('\n');
    });
    it('returns the value of the entity', function(){
      var entity = env.brandName.get();
      entity.value.should.equal("Firefox");
    });
    it('returns the value of the attribute', function(){
      var entity = env.brandName.get();
      entity.attributes.title.should.equal("Mozilla Firefox");
    });
  });

});
