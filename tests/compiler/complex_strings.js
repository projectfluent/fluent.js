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
  var env = {
    entries: {},
    globals: {}
  };

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    env.entries = {};
    Compiler.compile(ast, env.entries);
  });

  describe('reference by name alone', function(){
    it('returns "About Firefox"', function(){
      var value = env.entries['about1'].toString();
      value.should.equal('About Firefox');
    });
  });
  describe('reference to a property', function(){
    it('returns "About Firefox" with .release', function(){
      var value = env.entries['about2'].toString();
      value.should.equal('About Firefox');
    });
    it('returns "About Aurora" with .testing', function(){
      var value = env.entries['about3'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "About Firefox" with ["release"]', function(){
      var value = env.entries['about4'].toString();
      value.should.equal('About Firefox');
    });
    it('returns "About Aurora" with ["testing"]', function(){
      var value = env.entries['about5'].toString();
      value.should.equal('About Aurora');
    });
  });
  describe('deeper hash hierarchy', function(){
    it('returns "Firefox"', function(){
      var value = env.entries['about21'].toString();
      value.should.equal('About Firefox');
    });
    it('returns "Aurora" for .feminine', function(){
      var value = env.entries['about22'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for ["feminine"]', function(){
      var value = env.entries['about23'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora\'s" for .feminine.genitive', function(){
      var value = env.entries['about24'].toString();
      value.should.equal('About Aurora\'s');
    });
    it('returns "Aurora\'s" for ["feminine"].genitive', function(){
      var value = env.entries['about25'].toString()
      value.should.equal('About Aurora\'s');
    });
    it('returns "Aurora\'s" for ["feminine"]["genitive"]', function(){
      var value = env.entries['about26'].toString();
      value.should.equal('About Aurora\'s');
    });
    it('returns "Mozilla Aurora\'s" for .feminine.genitive.long', function(){
      var value = env.entries['about27'].toString();
      value.should.equal('About Mozilla Aurora\'s');
    });
  });
  describe('computed property name', function(){
    it('returns "Aurora" for [channels]', function(){
      var value = env.entries['about31'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for [channels.testing]', function(){
      var value = env.entries['about32'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for [channels["testing"]]', function(){
      var value = env.entries['about33'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Mozilla Aurora\'s" for .feminine.genitive[length[1]]', function(){
      var value = env.entries['about34'].toString();
      value.should.equal('About Mozilla Aurora\'s');
    });
  });
});
