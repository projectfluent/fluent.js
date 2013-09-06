var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser(true);
var compiler = new Compiler();

describe('Primitives:', function(){
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

  describe('Simple string value', function(){
    before(function() {
      source = [
        'foo=Foo'
      ].join('\n');
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
      source = [
        'foo=Foo',
        'bar={{ foo }} Bar',
        'baz={{ missing }}'
      ].join('\n');
    });
    it('returns the value', function(){
      var value = env.bar.getString();
      value.should.equal("Foo Bar");
    });
    // Bug 817610 - Optimize a fast path for String entities in the Compiler
    it('is detected to be maybe-complex', function(){
      env.bar.value.should.be.a('function');
    });
    it('throws when the referenced entity cannot be found', function(){
      (function() {
        env.baz.getString();
      }).should.throw(/unknown entry/);
    });
  });
  
  describe('Complex string referencing an entity with null value', function(){
    before(function() {
      source = [
        'foo.attr=Foo',
        'bar={{ foo }} Bar',
      ].join('\n');
    });
    it('returns the null value', function(){
      var entity = env.foo.get();
      entity.should.have.property('value', null);
    });
    it('returns the attribute', function(){
      var entity = env.foo.get();
      entity.attributes['attr'].should.equal('Foo');
    });
    it('throws when the referenced entity has null value', function(){
      (function() {
        env.bar.getString();
      }).should.throw(/Placeables must be strings or numbers/);
    });
  });

  describe('Cyclic reference', function(){
    before(function() {
      source = [
        'foo={{ bar }}',
        'bar={{ foo }}'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Cyclic self-reference', function(){
    before(function() {
      source = [
        'foo={{ foo }}'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.foo.getString();
      }).should.throw(/Cyclic reference detected/);
    });
  });

  describe('Cyclic self-reference in a hash', function(){
    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[one]={{ foo }}',
        'foo[two]=Bar',
        'bar={{ foo }}'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.foo.getString({n: 1});
      }).should.throw(/Cyclic reference detected/);
    });
    it('returns the valid value if requested directly', function(){
      var value = env.bar.getString({n: 2});
      value.should.equal("Bar");
    });
  });

});
