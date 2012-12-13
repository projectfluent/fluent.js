var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../_build/cov/lib/compiler.js').Compiler
  : require('../../lib/compiler.js').Compiler;
var Parser = require('../../lib/parser.js').Parser;

var compiler = new Compiler(null, Parser);
var parser = new Parser();

function read(filename) {
  var lol = fs.readFileSync('./tests/fixtures/' + filename).toString();
  return parser.parse(lol);
}

describe('Deep hierarchy', function(){
  var filename = 'nested_hash_deep.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('3-level-deep nested hash', function(){
    it('is "Firefox" when passed no index', function(){
      var value = env['brandName'].toString();
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine"]', function(){
      var value = env['brandName']._resolve({}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = env['brandName']._resolve({}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "short"]', function(){
      var value = env['brandName']._resolve({}, ['masculine', 'nominative', 'short']);
      value.should.equal('Firefox');
    });
    it('is "Mozilla Firefox" when passed an index of ["masculine", "nominative", "long"]', function(){
      var value = env['brandName']._resolve({}, ['masculine', 'nominative', 'long']);
      value.should.equal('Mozilla Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = env['brandName']._resolve({}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "short"]', function(){
      var value = env['brandName']._resolve({}, ['masculine', 'genitive', 'short']);
      value.should.equal('Firefox\'s');
    });
    it('is "Mozilla Firefox\'s" when passed an index of ["masculine", "genitive", "long"]', function(){
      var value = env['brandName']._resolve({}, ['masculine', 'genitive', 'long']);
      value.should.equal('Mozilla Firefox\'s');
    });
    it('is "Aurora" when passed an index of ["feminine"]', function(){
      var value = env['brandName']._resolve({}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = env['brandName']._resolve({}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "short"]', function(){
      var value = env['brandName']._resolve({}, ['feminine', 'nominative', 'short']);
      value.should.equal('Aurora');
    });
    it('is "Mozilla Aurora" when passed an index of ["feminine", "nominative", "long"]', function(){
      var value = env['brandName']._resolve({}, ['feminine', 'nominative', 'long']);
      value.should.equal('Mozilla Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = env['brandName']._resolve({}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "short"]', function(){
      var value = env['brandName']._resolve({}, ['feminine', 'genitive', 'short']);
      value.should.equal('Aurora\'s');
    });
    it('is "Mozilla Aurora\'s" when passed an index of ["feminine", "genitive", "long"]', function(){
      var value = env['brandName']._resolve({}, ['feminine', 'genitive', 'long']);
      value.should.equal('Mozilla Aurora\'s');
    });
  });
});
