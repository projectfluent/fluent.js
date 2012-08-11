var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Deep hierarchy', function(){
  var filename = 'nested_hash_deep.json';
  var ast;
  var obj;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('3-level-deep nested hash', function(){
    it('is "Firefox" when passed no index', function(){
      var value = obj['brandName'].toString(obj);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "short"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine', 'nominative', 'short']);
      value.should.equal('Firefox');
    });
    it('is "Mozilla Firefox" when passed an index of ["masculine", "nominative", "long"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine', 'nominative', 'long']);
      value.should.equal('Mozilla Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "short"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine', 'genitive', 'short']);
      value.should.equal('Firefox\'s');
    });
    it('is "Mozilla Firefox\'s" when passed an index of ["masculine", "genitive", "long"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['masculine', 'genitive', 'long']);
      value.should.equal('Mozilla Firefox\'s');
    });
    it('is "Aurora" when passed an index of ["feminine"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "short"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine', 'nominative', 'short']);
      value.should.equal('Aurora');
    });
    it('is "Mozilla Aurora" when passed an index of ["feminine", "nominative", "long"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine', 'nominative', 'long']);
      value.should.equal('Mozilla Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "short"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine', 'genitive', 'short']);
      value.should.equal('Aurora\'s');
    });
    it('is "Mozilla Aurora\'s" when passed an index of ["feminine", "genitive", "long"]', function(){
      var value = obj['brandName'].toString(obj, {}, ['feminine', 'genitive', 'long']);
      value.should.equal('Mozilla Aurora\'s');
    });
  });
});
