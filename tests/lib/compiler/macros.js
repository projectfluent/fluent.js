var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Macros', function(){
  var source, ctxdata, ast, env;
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

  describe('referencing macros', function(){
    before(function() {
      ctxdata = {
        n: 1
      };
      source = [
        'placeMacro={{ plural }}'
      ].join('\n');
    });
    it('throws when resolving (not calling) a macro in a complex string', function() {
      (function() {
        env.placeMacro.getString(ctxdata);
      }).should.throw(/uncalled/i);
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
      (function() {
        env.passFoo.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
    it('throws if a complex entity is passed', function() {
      (function() {
        env.passUseFoo.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
    it('throws if a hash entity is passed', function() {
      (function() {
        env.passBar.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
    it('throws if a macro is passed', function() {
      (function() {
        env.passPlural.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
    it('throws if a missing entry is passed', function() {
      (function() {
        env.passMissing.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
    it('throws if a native function is passed', function() {
      (function() {
        env.passWatch.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
  });
});

describe('A simple plural macro', function(){
  var source, ctxdata, ast, env;
  beforeEach(function() {
    ast = parser.parse(source);
    ast.body['plural'] = {
      type: 'Macro',
      args: [{
        type: 'Identifier',
        name: 'n'
      }],
      expression: function(n) {
        // a made-up plural rule:
        // [0, 1) -> other
        // [1, Inf) -> many
        return (n >= 0 && n < 1) ? 'other' : 'many';
      }
    };
    env = compiler.compile(ast);
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
      var value = env.foo.getString({n: 0});
      value.should.equal('Zero');
    });
    it('returns one for 1', function() {
      var value = env.foo.getString({n: 1});
      value.should.equal('One');
    });
    it('returns two for 2', function() {
      var value = env.foo.getString({n: 2});
      value.should.equal('Two');
    });
    it('returns many for 3', function() {
      var value = env.foo.getString({n: 3});
      value.should.equal('Many');
    });
    it('returns many for 5', function() {
      var value = env.foo.getString({n: 5});
      value.should.equal('Many');
    });
    it('returns other for 0.5', function() {
      var value = env.foo.getString({n: .5});
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
      var value = env.foo.getString({n: 0});
      value.should.equal('Other');
    });
    it('returns many for 1', function() {
      var value = env.foo.getString({n: 1});
      value.should.equal('Many');
    });
    it('returns many for 2', function() {
      var value = env.foo.getString({n: 2});
      value.should.equal('Many');
    });
    it('returns many for 3', function() {
      var value = env.foo.getString({n: 3});
      value.should.equal('Many');
    });
    it('returns many for 5', function() {
      var value = env.foo.getString({n: 5});
      value.should.equal('Many');
    });
    it('returns other for 0.5', function() {
      var value = env.foo.getString({n: .5});
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
      var value = env.foo.getString({n: 0});
      value.should.equal('Other');
    });
    it('returns other for 1', function() {
      var value = env.foo.getString({n: 1});
      value.should.equal('Other');
    });
    it('returns other for 2', function() {
      var value = env.foo.getString({n: 2});
      value.should.equal('Other');
    });
    it('returns other for 3', function() {
      var value = env.foo.getString({n: 3});
      value.should.equal('Other');
    });
    it('returns other for 5', function() {
      var value = env.foo.getString({n: 5});
      value.should.equal('Other');
    });
    it('returns other for 0.5', function() {
      var value = env.foo.getString({n: .5});
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
      (function() {
        env.foo.getString({n: 0});
      }).should.throw(/tried "other"/);
    });
    it('returns one for 1', function() {
      var value = env.foo.getString({n: 1});
      value.should.equal('One');
    });
    it('returns other for 2', function() {
      (function() {
        env.foo.getString({n: 2});
      }).should.throw(/tried "many"/);
    });
    it('returns other for 3', function() {
      (function() {
        env.foo.getString({n: 3});
      }).should.throw(/tried "many"/);
    });
    it('returns other for 5', function() {
      (function() {
        env.foo.getString({n: 5});
      }).should.throw(/tried "many"/);
    });
    it('returns other for 0.5', function() {
      (function() {
        env.foo.getString({n: .5});
      }).should.throw(/tried "other"/);
    });
  });

});
