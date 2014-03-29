'use strict';

var should = require('should');

var compile = require('./helper').compile;

describe('Compiler errors:', function(){
  var source, env;
  beforeEach(function() {
    env = compile(source);
  });

  describe('A complex string referencing an existing entity', function(){
    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });
    it('works with the default index', function(){
      env.prompt.toString({n: 1}).should.equal("One File");
    });
  });

  describe('A complex string referencing a missing entity', function(){
    before(function() {
      source = [
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });
    it('returns the raw string', function(){
      var value = env.prompt.toString({n: 1});
      value.should.equal('One {{ file }}');
    });
  });

  describe('A ctxdata variable in the index, with "other"', function(){
    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
        'prompt[other]=Files'
      ].join('\n');
    });
    it('is found', function(){
      env.prompt.toString({n: 1}).should.equal("One File");
    });
    it('throws an IndexError if n is not defined', function(){
      var value = env.prompt.toString();
      value.should.equal('Files');
    });
  });

  describe('A ctxdata variable in the index, without "other"', function(){
    before(function() {
      source = [
        'file=File',
        'prompt={[ plural(n) ]}',
        'prompt[one]=One {{ file }}',
      ].join('\n');
    });
    it('is found', function(){
      env.prompt.toString({n: 1}).should.equal("One File");
    });
    it('throws an IndexError if n is not defined', function(){
      var value = env.prompt.toString();
      should.equal(value, undefined);
    });
  });

});

