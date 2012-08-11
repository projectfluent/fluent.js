var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Complex strings', function(){
  var filename = 'complex_strings.json';
  var ast;
  var obj;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('reference by name alone', function(){
    it('returns "About Firefox"', function(){
      var value = obj['about1'].toString(obj);
      value.should.equal('About Firefox');
    });
  });
  describe('reference to a property', function(){
    it('returns "About Firefox" with .release', function(){
      var value = obj['about2'].toString(obj);
      value.should.equal('About Firefox');
    });
    it('returns "About Aurora" with .testing', function(){
      var value = obj['about3'].toString(obj);
      value.should.equal('About Aurora');
    });
    it('returns "About Firefox" with ["release"]', function(){
      var value = obj['about4'].toString(obj);
      value.should.equal('About Firefox');
    });
    it('returns "About Aurora" with ["testing"]', function(){
      var value = obj['about5'].toString(obj);
      value.should.equal('About Aurora');
    });
  });
  describe('deeper hash hierarchy', function(){
    it('returns "Firefox"', function(){
      var value = obj['about21'].toString(obj);
      value.should.equal('About Firefox');
    });
    it('returns "Aurora" for .feminine', function(){
      var value = obj['about22'].toString(obj);
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for ["feminine"]', function(){
      var value = obj['about23'].toString(obj);
      value.should.equal('About Aurora');
    });
    it('returns "Aurora\'s" for .feminine.genitive', function(){
      var value = obj['about24'].toString(obj);
      value.should.equal('About Aurora\'s');
    });
    it('returns "Aurora\'s" for ["feminine"].genitive', function(){
      var value = obj['about25'].toString(obj);
      value.should.equal('About Aurora\'s');
    });
    it('returns "Aurora\'s" for ["feminine"]["genitive"]', function(){
      var value = obj['about26'].toString(obj);
      value.should.equal('About Aurora\'s');
    });
    it('returns "Mozilla Aurora\'s" for .feminine.genitive.long', function(){
      var value = obj['about27'].toString(obj);
      value.should.equal('About Mozilla Aurora\'s');
    });
  });
  describe('computed property name', function(){
    it('returns "Aurora" for [channels]', function(){
      var value = obj['about31'].toString(obj);
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for [channels.testing]', function(){
      var value = obj['about32'].toString(obj);
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for [channels["testing"]]', function(){
      var value = obj['about33'].toString(obj);
      value.should.equal('About Aurora');
    });
    it('returns "Mozilla Aurora\'s" for .feminine.genitive[length[1]]', function(){
      var value = obj['about34'].toString(obj);
      value.should.equal('About Mozilla Aurora\'s');
    });
  });
});
