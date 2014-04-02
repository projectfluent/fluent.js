'use strict';

var assert = require('assert');
var compile = require('./helper').compile;

describe('Index', function(){
  var source, env;
  beforeEach(function() {
    env = compile(source);
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
      assert.strictEqual(value, undefined);
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
      assert.strictEqual(entity.value, 'Foo');
      assert.strictEqual(entity.attributes.attr, undefined);
    });
  });

});
