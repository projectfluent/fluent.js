'use strict';

var Parser = require('../../../lib/l20n/parser').Parser;
var compile = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').compile
  : require('../../../lib/l20n/compiler').compile;
var getPluralRule = require('../../../lib/l20n/plurals').getPluralRule;

var parser = new Parser();

describe('Attributes', function(){
  var source, env;
  beforeEach(function() {
    env = compile(parser.parse(source));
    env.__plural = getPluralRule('en-US');
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
      var entity = env.foo.valueOf();
      entity.attributes.attr.should.equal('An attribute');
    });
    it('returns the value with a placeable', function(){
      var entity = env.foo.valueOf();
      entity.attributes.attrComplex.should.equal('An attribute referencing Bar');
    });
    it('is a string', function(){
      env.foo.attributes.attr.should.have.property('value');
    });
    it('is an object', function(){
      env.foo.attributes.attrComplex.should.have.property('value');
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
      var value = env.update.toString();
      value.should.equal("Update");
    });
    it('returns the value of the attribute\'s member', function(){
      var entity = env.update.valueOf({n: 1});
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
      var entity = env.update.valueOf({n: 1, k: 2});
      entity.value.should.equal("One update");
    });
    it('returns the value of the attribute', function(){
      var entity = env.update.valueOf({n: 1, k: 2});
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
      var entity = env.brandName.valueOf();
      entity.value.should.equal("Firefox");
    });
    it('returns the value of the attribute', function(){
      var entity = env.brandName.valueOf();
      entity.attributes.title.should.equal("Mozilla Firefox");
    });
  });

  describe('with cyclic self-references', function(){
    before(function() {
      source = [
        'brandName=Firefox',
        'brandName.title=Mozilla {{ brandName.title }}'
      ].join('\n');
    });
    it('returns the raw string of the attribute', function(){
      var entity = env.brandName.valueOf();
      entity.attributes.title.should.equal("Mozilla {{ brandName.title }}");
    });
  });

});
