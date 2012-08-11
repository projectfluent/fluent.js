var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Basic entities', function(){
  var filename = 'simple_values.json';
  var ast;
  var obj;

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('Simple value', function(){
    describe('Simple string value', function(){
      it('is "Firefox"', function(){
        var value = obj['brandName'].get();
        value.should.equal("Firefox");
      });
    });
  });

  describe('Simple array', function(){
    describe('an array without an index', function(){
      it('is "Firefox" when called without an index', function(){
        var value = obj['brandName11'].get(obj);
        value.should.equal('Firefox');
      });
      it('is "Firefox" when called with [0]', function(){
        var value = obj['brandName11'].get(obj, {}, [0]);
        value.should.equal('Firefox');
      });
      it('is "Aurora" when called with [1]', function(){
        var value = obj['brandName11'].get(obj, {}, [1]);
        value.should.equal('Aurora');
      });
      it('is "Firefox" when called with [7]', function(){
        // XXX different in the DEBUG mode
        var value = obj['brandName11'].get(obj, {}, [7]);
        value.should.equal('Firefox');
      });
      it('is "Aurora" when called with [1, 7]', function(){
        // XXX different in the DEBUG mode
        var value = obj['brandName11'].get(obj, {}, [1, 7]);
        value.should.equal('Aurora');
      });
    });
    describe('an array with an index of [1]', function(){
      it('is "Aurora" when called without an index', function(){
        var value = obj['brandName12'].get(obj);
        value.should.equal('Aurora');
      });
      it('is "Firefox" when called with [0]', function(){
        var value = obj['brandName12'].get(obj, {}, [0]);
        value.should.equal('Firefox');
      });
      it('is "Firefox" when called with [7]', function(){
        // XXX different in the DEBUG mode
        var value = obj['brandName12'].get(obj, {}, [7]);
        value.should.equal('Firefox');
      });
      it('is "Firefox" when called with [7, 7]', function(){
        // XXX different in the DEBUG mode
        var value = obj['brandName12'].get(obj, {}, [7, 7]);
        value.should.equal('Firefox');
      });
    });
  });

  describe('Simple hash', function(){
    describe('a hash with no index and no default value', function(){
      it('is "Firefox"', function(){
        var value = obj['brandName21'].get(obj);
        value.should.equal('Firefox');
      });
      it('is "Aurora when called with an index of ["feminine"] "', function(){
        var value = obj['brandName21'].get(obj, {}, ['feminine']);
        value.should.equal('Aurora');
      });
    });
    describe('a hash with no index and with a default value', function(){
      it('is "Aurora"', function(){
        var value = obj['brandName22'].get(obj);
        value.should.equal('Aurora');
      });
      it('is "Firefox" when called with an index of ["masculine"] ', function(){
        var value = obj['brandName22'].get(obj, {}, ['masculine']);
        value.should.equal('Firefox');
      });
    });
    describe('a hash with an index and no default value', function(){
      it('is "Aurora"', function(){
        var value = obj['brandName23'].get(obj);
        value.should.equal('Aurora');
      });
      it('is "Firefox" when called with an index of ["masculine"] ', function(){
        var value = obj['brandName23'].get(obj, {}, ['masculine']);
        value.should.equal('Firefox');
      });
    });
    describe('a hash with too many index keys and no default value', function(){
      it('is "Aurora"', function(){
        // XXX different in the DEBUG mode
        var value = obj['brandName23'].get(obj);
        value.should.equal('Aurora');
      });
    });
  });
});
