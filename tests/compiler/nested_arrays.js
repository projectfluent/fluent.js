var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Nested array', function(){
  var filename = 'nested_arrays.json';
  var ast;
  var obj;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('without an index', function(){
    it('is "Firefox" when passedout an index', function(){
      var value = obj['brandName11'].get(obj);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = obj['brandName11'].get(obj, {}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = obj['brandName11'].get(obj, {}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = obj['brandName11'].get(obj, {}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = obj['brandName11'].get(obj, {}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = obj['brandName11'].get(obj, {}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = obj['brandName11'].get(obj, {}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName11'].get(obj, {}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of [1]', function(){
    it('is "Aurora" when passedout an index', function(){
      var value = obj['brandName12'].get(obj);
      value.should.equal('Aurora');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = obj['brandName12'].get(obj, {}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = obj['brandName12'].get(obj, {}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = obj['brandName12'].get(obj, {}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = obj['brandName12'].get(obj, {}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = obj['brandName12'].get(obj, {}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = obj['brandName12'].get(obj, {}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName12'].get(obj, {}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
  describe('array with an index of [1, 1]', function(){
    it('is "Aurora\'s" when passed no index', function(){
      var value = obj['brandName13'].get(obj);
      value.should.equal('Aurora\'s');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = obj['brandName13'].get(obj, {}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = obj['brandName13'].get(obj, {}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = obj['brandName13'].get(obj, {}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = obj['brandName13'].get(obj, {}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = obj['brandName13'].get(obj, {}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = obj['brandName13'].get(obj, {}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName13'].get(obj, {}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of [7]', function(){
    it('is "Firefox" when passed no index', function(){
      var value = obj['brandName14'].get(obj);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [7, 8]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [7, 8]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0]', function(){
      var value = obj['brandName14'].get(obj, {}, [0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0]', function(){
      var value = obj['brandName14'].get(obj, {}, [0, 0]);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed [0, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [0, 0, 7]);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed [0, 1]', function(){
      var value = obj['brandName14'].get(obj, {}, [0, 1]);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed [0, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [0, 1, 7]);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed [1]', function(){
      var value = obj['brandName14'].get(obj, {}, [1]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [1, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0]', function(){
      var value = obj['brandName14'].get(obj, {}, [1, 0]);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed [1, 0, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [1, 0, 7]);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed [1, 1]', function(){
      var value = obj['brandName14'].get(obj, {}, [1, 1]);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed [1, 1, 7]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName14'].get(obj, {}, [1, 1, 7]);
      value.should.equal('Aurora\'s');
    });
  });
});
