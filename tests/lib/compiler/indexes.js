'use strict';

var should = require('should');

var Parser = require('../../../lib/l20n/parser').Parser;
var compile = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').compile
  : require('../../../lib/l20n/compiler').compile;
var getPluralRule = require('../../../lib/l20n/plurals').getPluralRule;

var parser = new Parser();

describe('Index', function(){
  var source, env;
  beforeEach(function() {
    env = compile(parser.parse(source));
    env.__plural = getPluralRule('en-US');
  });

  describe('Cyclic reference to the same entity', function(){
    before(function() {
      source = [
        'foo={[ plural(foo) ]}',
        'foo[one]=One'
      ].join('\n');
    });
    it('is undefined', function() {
      var value = env.foo.toString();
      should.equal(value, undefined);
    });
  });

  describe('Reference from an attribute to the value of the same entity', function(){
    before(function() {
      source = [
        'foo=Foo',
        'foo.attr={[ plural(foo) ]}',
        'foo.attr[one]=One'
      ].join('\n');
    });
    it('value of the attribute is undefined', function() {
      var entity = env.foo.valueOf();
      should.equal(entity.value, 'Foo');
      should.equal(entity.attr, undefined);
    });
  });

});
