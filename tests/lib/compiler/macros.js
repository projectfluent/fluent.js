'use strict';

var should = require('should');

var Parser = require('../../../lib/l20n/parser').Parser;
var compile = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').compile
  : require('../../../lib/l20n/compiler').compile;
var getPluralRule = require('../../../lib/l20n/plurals').getPluralRule;

var parser = new Parser();

describe('Macros', function(){
  var source, ctxdata, env;
  beforeEach(function() {
    env = compile(parser.parse(source));
    env.__plural = getPluralRule('en-US');
  });

  describe('referencing macros', function(){
    before(function() {
      ctxdata = {
        n: 1
      };
      source = [
        'placeMacro={{ plural }}',
        'placeRealMacro={{ __plural }}'
      ].join('\n');
    });
    it('throws when resolving (not calling) a macro in a complex string', function() {
      env.placeMacro.toString(ctxdata).should.equal('{{ plural }}');
      env.placeRealMacro.toString(ctxdata).should.equal('{{ __plural }}');
    });
  });

  describe('passing arguments', function(){
    before(function() {
      ctxdata = {
        n: 1
      };
      source = [
        'foo=Foo',
        'useFoo={{ foo }}',
        'bar={[ plural(n) ]}',
        'bar[one]=One',
        'bar.attr=Attr',

        'passFoo={[ plural(foo) ]}',
        'passFoo[one]=One',

        'passUseFoo={[ plural(useFoo) ]}',
        'passUseFoo[one]=One',

        'passBar={[ plural(bar) ]}',
        'passBar[one]=One',

        'passPlural={[ plural(plural) ]}',
        'passPlural[one]=One',

        'passMissing={[ plural(missing) ]}',
        'passMissing[one]=One',

        'passWatch={[ plural(watch) ]}',
        'passWatch[one]=One',
      ].join('\n');
    });
    it('throws if an entity is passed', function() {
      var value = env.passFoo.toString(ctxdata);
      should.equal(value, undefined);
    });
    it('throws if a complex entity is passed', function() {
      var value = env.passUseFoo.toString(ctxdata);
      should.equal(value, undefined);
    });
    it('throws if a hash entity is passed', function() {
      var value = env.passBar.toString(ctxdata);
      should.equal(value, undefined);
    });
    it('throws if a macro is passed', function() {
      var value = env.passPlural.toString(ctxdata);
      should.equal(value, undefined);
    });
    it('throws if a missing entry is passed', function() {
      var value = env.passMissing.toString(ctxdata);
      should.equal(value, undefined);
    });
    it('throws if a native function is passed', function() {
      var value = env.passWatch.toString(ctxdata);
      should.equal(value, undefined);
    });
  });
});

describe('A simple plural macro', function(){
  var source, env;
  beforeEach(function() {
    env = compile(parser.parse(source));
    env.__plural = function(n) {
      // a made-up plural rule:
      // [0, 1) -> other
      // [1, Inf) -> many
      return (n >= 0 && n < 1) ? 'other' : 'many';
    };
  });

  describe('an entity with all plural forms defined', function(){
    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[zero]=Zero',
        'foo[one]=One',
        'foo[two]=Two',
        'foo[few]=Few',
        'foo[many]=Many',
        'foo[other]=Other'
      ].join('\n');
    });
    it('returns zero for 0', function() {
      var value = env.foo.toString({n: 0});
      value.should.equal('Zero');
    });
    it('returns one for 1', function() {
      var value = env.foo.toString({n: 1});
      value.should.equal('One');
    });
    it('returns two for 2', function() {
      var value = env.foo.toString({n: 2});
      value.should.equal('Two');
    });
    it('returns many for 3', function() {
      var value = env.foo.toString({n: 3});
      value.should.equal('Many');
    });
    it('returns many for 5', function() {
      var value = env.foo.toString({n: 5});
      value.should.equal('Many');
    });
    it('returns other for 0.5', function() {
      var value = env.foo.toString({n: .5});
      value.should.equal('Other');
    });
  });

  describe('an entity without the zero, one and two forms', function(){
    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[many]=Many',
        'foo[other]=Other'
      ].join('\n');
    });
    it('returns other for 0', function() {
      var value = env.foo.toString({n: 0});
      value.should.equal('Other');
    });
    it('returns many for 1', function() {
      var value = env.foo.toString({n: 1});
      value.should.equal('Many');
    });
    it('returns many for 2', function() {
      var value = env.foo.toString({n: 2});
      value.should.equal('Many');
    });
    it('returns many for 3', function() {
      var value = env.foo.toString({n: 3});
      value.should.equal('Many');
    });
    it('returns many for 5', function() {
      var value = env.foo.toString({n: 5});
      value.should.equal('Many');
    });
    it('returns other for 0.5', function() {
      var value = env.foo.toString({n: .5});
      value.should.equal('Other');
    });
  });

  describe('an entity without the many form', function(){
    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[other]=Other'
      ].join('\n');
    });
    it('returns other for 0', function() {
      var value = env.foo.toString({n: 0});
      value.should.equal('Other');
    });
    it('returns other for 1', function() {
      var value = env.foo.toString({n: 1});
      value.should.equal('Other');
    });
    it('returns other for 2', function() {
      var value = env.foo.toString({n: 2});
      value.should.equal('Other');
    });
    it('returns other for 3', function() {
      var value = env.foo.toString({n: 3});
      value.should.equal('Other');
    });
    it('returns other for 5', function() {
      var value = env.foo.toString({n: 5});
      value.should.equal('Other');
    });
    it('returns other for 0.5', function() {
      var value = env.foo.toString({n: .5});
      value.should.equal('Other');
    });
  });

  describe('an entity without the other form, but with the one form', function(){
    before(function() {
      source = [
        'foo={[ plural(n) ]}',
        'foo[one]=One'
      ].join('\n');
    });
    it('returns other for 0', function() {
      var value = env.foo.toString({n: 0});
      should.equal(value, undefined);
    });
    it('returns one for 1', function() {
      var value = env.foo.toString({n: 1});
      value.should.equal('One');
    });
    it('returns other for 2', function() {
      var value = env.foo.toString({n: 2});
      should.equal(value, undefined);
    });
    it('returns other for 3', function() {
      var value = env.foo.toString({n: 3});
      should.equal(value, undefined);
    });
    it('returns other for 5', function() {
      var value = env.foo.toString({n: 5});
      should.equal(value, undefined);
    });
    it('returns other for 0.5', function() {
      var value = env.foo.toString({n: .5});
      should.equal(value, undefined);
    });
  });

});
