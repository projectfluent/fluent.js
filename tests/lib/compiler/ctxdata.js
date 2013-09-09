var Parser = require('../../../lib/l20n/parser').Parser;
var Compiler = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Compiler
  : require('../../../lib/l20n/compiler').Compiler;

var parser = new Parser();
var compiler = new Compiler();

describe('Context data', function(){
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

  describe('in entities', function(){
    before(function() {
      ctxdata = {
        unreadNotifications: 3,
        foo: "Foo" 
      };
      source = [
        'unread=Unread notifications: {{ unreadNotifications }}',
        'unreadPlural={[ plural(unreadNotifications) ]}',
        'unreadPlural[one]=One unread notification',
        'unreadPlural[other]={{ unreadNotifications}} unread notifications',
        'foo=Bar',
        'useFoo={{ foo }}'
      ].join('\n');
    });
    it('can be referenced from strings', function() {
      var value = env.unread.getString(ctxdata);
      value.should.equal('Unread notifications: 3');
    });
    it('can be passed as argument to a macro', function() {
      var value = env.unreadPlural.getString(ctxdata);
      value.should.equal('3 unread notifications');
    });
    it('takes priority over entities of the same name', function() {
      var value = env.useFoo.getString(ctxdata);
      value.should.equal('Foo');
    });
  });

  describe('and simple errors', function(){
    before(function() {
      ctxdata = {
        nested: {
        }
      };
      source = [
        'missingReference={{ missing }}',
        'nestedReference={{ nested }}',
        'watchReference={{ watch }}',
        'hasOwnPropertyReference={{ hasOwnProperty }}',
        'isPrototypeOfReference={{ isPrototypeOf }}',
        'toStringReference={{ toString }}',
        'protoReference={{ __proto__ }}',
      ].join('\n');
    });
    it('throws when a missing property of ctxdata is referenced', function(){
      (function() {
        var value = env.missingReference.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
    it('throws when an object is referenced', function(){
      (function() {
        var value = env.nestedReference.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata of type object');
    });
    it('throws when watch is referenced', function(){
      (function() {
        var value = env.watchReference.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
    it('throws when hasOwnProperty is referenced', function(){
      (function() {
        var value = env.hasOwnPropertyReference.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
    it('throws when isPrototypeOf is referenced', function(){
      (function() {
        var value = env.isPrototypeOfReference.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
    it('throws when toString is referenced', function(){
      (function() {
        var value = env.toStringReference.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
    it('throws when __proto__ is referenced', function(){
      (function() {
        var value = env.protoReference.getString(ctxdata);
      }).should.throw(/unknown entry/);
    });
  });

  describe('and strings', function(){
    before(function() {
      ctxdata = {
        str: 'string',
        num: '1'
      };
      source = [
        'stringProp={{ str }}',
        'stringIndex={[ plural(str) ]}',
        'stringIndex[one]=One',
        'stringNumProp={{ num }}',
        'stringNumIndex={[ plural(num) ]}',
        'stringNumIndex[one]=One'
      ].join('\n');
    });
    it('returns a string value', function(){
      env.stringProp.getString(ctxdata).should.equal('string');
    });
    it('throws when used in a macro', function(){
      (function() {
        var value = env.stringIndex.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
    it('digit returns a string value', function(){
      env.stringNumProp.getString(ctxdata).should.equal('1');
    });
    it('digit works used in a macro', function(){
      var value = env.stringNumIndex.getString(ctxdata);
      value.should.equal('One');
    });
  });

  describe('and numbers', function(){
    before(function() {
      ctxdata = {
        num: 1
      };
      source = [
        'numProp={{ num }}',
        'numIndex={[ plural(num) ]}',
        'numIndex[one]=One'
      ].join('\n');
    });
    it('returns a number value', function(){
      env.numProp.getString(ctxdata).should.equal('1');
    });
    it('returns a value when used in macro', function(){
      env.numIndex.getString(ctxdata).should.equal('One');
    });
  });

  describe('and bools', function(){
    before(function() {
      ctxdata = {
        bool: true
      };
      source = [
        'boolProp={{ bool }}',
        'boolIndex={[ plural(bool) ]}',
        'boolIndex[one]=One'
      ].join('\n');
    });
    it('throws when referenced', function(){
      (function() {
        env.boolProp.getString(ctxdata);
      }).should.throw(/must be strings or numbers/);
    });
    it('throws when used in a macro', function(){
      (function() {
        env.boolIndex.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
  });

  describe('and undefined', function(){
    before(function() {
      ctxdata = {
        undef: undefined
      };
      source = [
        'undefProp={{ undef }}',
        'undefIndex={[ plural(undef) ]}',
        'undefIndex[one]=One'
      ].join('\n');
    });
    it('throws when referenced', function(){
      (function() {
        env.undefProp.getString(ctxdata);
      }).should.throw(/must be strings or numbers/);
    });
    it('throws when used in a macro', function(){
      (function() {
        env.undefIndex.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
  });

  describe('and null', function(){
    before(function() {
      ctxdata = {
        nullable: null
      };
      source = [
        'nullProp={{ nullable }}',
        'nullIndex={[ plural(nullable) ]}',
        'nullIndex[one]=One'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.nullProp.getString(ctxdata);
      }).should.throw(/must be strings or numbers/);
    });
    it('throws when used in a macro', function(){
      (function() {
        env.nullIndex.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
  });

  describe('and arrays where first element is number', function(){
    before(function() {
      ctxdata = {
        arr: [1, 2]
      };
      source = [
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.arrProp.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata of type object');
    });
    it('throws when used in a macro', function(){
      var value = env.arrIndex.getString(ctxdata);
      value.should.equal('One');
    });
  });

  describe('and arrays where first element is not a number', function(){
    before(function() {
      ctxdata = {
        arr: ['a', 'b']
      };
      source = [
        'arrProp={{ arr }}',
        'arrIndex={[ plural(arr) ]}',
        'arrIndex[one]=One'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.arrProp.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata of type object');
    });
    it('throws when used in a macro', function(){
      (function() {
        env.arrIndex.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
  });

  describe('and objects', function(){
    before(function() {
      ctxdata = {
        obj: { 
          key: 'value' 
        }
      };
      source = [
        'objProp={{ obj }}',
        'objIndex={[ plural(obj) ]}',
        'objIndex[one]=One'
      ].join('\n');
    });
    it('throws', function(){
      (function() {
        env.objProp.getString(ctxdata);
      }).should.throw('Cannot resolve ctxdata of type object');
    });
    it('throws when used in a macro', function(){
      (function() {
        env.objIndex.getString(ctxdata);
      }).should.throw(/must be numbers/);
    });
  });

});
