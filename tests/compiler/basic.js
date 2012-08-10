var fs = require('fs');
var should = require('should');
var Compiler = require('../../../js/compiler.js');

function read(filename) {
  return JSON.parse(fs.readFileSync(filename)).body;
}

describe('Basic entities', function(){
  var ast;
  var obj;

  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('Simple value', function(){
    var filename = './lol/basic1.json';
    before(function() { 
      ast = read(filename);
    });

    describe('Simple string value', function(){
      it('is "Simple"', function(){
        var value = obj['basic1'].get();
        value.should.equal("Basic 1");
      });
    });
  });

  describe('Simple array', function(){
    var filename = './lol/basic2.json';
    before(function() { 
      ast = read(filename);
    });

    describe('an array without an index', function(){
      it('is "One" when called without an index', function(){
        var value = obj['basic21'].get(obj);
        value.should.equal('One');
      });
      it('is "Two" when called with [1]', function(){
        var value = obj['basic21'].get(obj, {}, [1]);
        value.should.equal('Two');
      });
    });
    describe('an array with an index of [1]', function(){
      it('is "Two" when called without an index', function(){
        var value = obj['basic22'].get(obj);
        value.should.equal('Two');
      });
      it('is "One" when called with [0]', function(){
        var value = obj['basic22'].get(obj, {}, [0]);
        value.should.equal('One');
      });
    });
  });

  describe('Simple hash', function(){
    var filename = './lol/basic3.json';
    before(function() { 
      ast = read(filename);
    });

    describe('a hash with no index and no default value', function(){
      it('is "Firefox"', function(){
        var value = obj['brandName1'].get(obj);
        value.should.equal('Firefox');
      });
      it('is "Aurora when called with an index of ["feminine"] "', function(){
        var value = obj['brandName1'].get(obj, {}, ['feminine']);
        value.should.equal('Aurora');
      });
    });
    describe('a hash with no index and with a default value', function(){
      it('is "Aurora"', function(){
        var value = obj['brandName2'].get(obj);
        value.should.equal('Aurora');
      });
      it('is "Firefox" when called with an index of ["masculine"] ', function(){
        var value = obj['brandName2'].get(obj, {}, ['masculine']);
        value.should.equal('Firefox');
      });
    });
    describe('a hash with an index and no default value', function(){
      it('is "Aurora"', function(){
        var value = obj['brandName3'].get(obj);
        value.should.equal('Aurora');
      });
      it('is "Firefox" when called with an index of ["masculine"] ', function(){
        var value = obj['brandName3'].get(obj, {}, ['masculine']);
        value.should.equal('Firefox');
      });
    });
    describe('a hash with too many index keys and no default value', function(){
      it('is "Aurora"', function(){
        var value = obj['brandName3'].get(obj);
        value.should.equal('Aurora');
      });
    });
  });
});
