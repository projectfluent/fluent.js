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

describe('Complex strings', function(){
  var filename = 'complex_strings.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('reference by name alone', function(){
    it('returns "About Firefox"', function(){
      var value = env['about1'].toString();
      value.should.equal('About Firefox');
    });
  });
  describe('reference to a property', function(){
    it('returns "About Firefox" with .release', function(){
      var value = env['about2'].toString();
      value.should.equal('About Firefox');
    });
    it('returns "About Aurora" with .testing', function(){
      var value = env['about3'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "About Firefox" with ["release"]', function(){
      var value = env['about4'].toString();
      value.should.equal('About Firefox');
    });
    it('returns "About Aurora" with ["testing"]', function(){
      var value = env['about5'].toString();
      value.should.equal('About Aurora');
    });
  });
  describe('deeper hash hierarchy', function(){
    it('returns "Firefox"', function(){
      var value = env['about21'].toString();
      value.should.equal('About Firefox');
    });
    it('returns "Aurora" for .feminine', function(){
      var value = env['about22'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for ["feminine"]', function(){
      var value = env['about23'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora\'s" for .feminine.genitive', function(){
      var value = env['about24'].toString();
      value.should.equal('About Aurora\'s');
    });
    it('returns "Aurora\'s" for ["feminine"].genitive', function(){
      var value = env['about25'].toString()
      value.should.equal('About Aurora\'s');
    });
    it('returns "Aurora\'s" for ["feminine"]["genitive"]', function(){
      var value = env['about26'].toString();
      value.should.equal('About Aurora\'s');
    });
    it('returns "Mozilla Aurora\'s" for .feminine.genitive.long', function(){
      var value = env['about27'].toString();
      value.should.equal('About Mozilla Aurora\'s');
    });
  });
  describe('computed property name', function(){
    it('returns "Aurora" for [channels]', function(){
      var value = env['about31'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for [channels.testing]', function(){
      var value = env['about32'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Aurora" for [channels["testing"]]', function(){
      var value = env['about33'].toString();
      value.should.equal('About Aurora');
    });
    it('returns "Mozilla Aurora\'s" for .feminine.genitive[length[1]]', function(){
      var value = env['about34'].toString();
      value.should.equal('About Mozilla Aurora\'s');
    });
  });
});
