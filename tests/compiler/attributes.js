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

describe('Attributes', function(){
  var filename = 'attributes.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('Basic attribute call', function(){
    it('returns "About Mozilla Firefox"', function(){
      var value = env['about1'].toString();
      value.should.equal("About Mozilla Firefox");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env['about2'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env['about2Win'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Linux"', function(){
      var value = env['about2Linux'].toString();
      value.should.equal("About Firefox on Linux");
    });
  });
  describe('"This" expression (~) used in an attribute', function(){
    it('returns "About Mozilla Firefox"', function(){
      var value = env['about3'].toString();
      value.should.equal("About Mozilla Firefox");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env['about4'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env['about4Win'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Linux"', function(){
      var value = env['about4Linux'].toString();
      value.should.equal("About Firefox on Linux");
    });
  });
  describe('"This" expression (~) used in the value to reference an attribute', function(){
    it('returns "Mozilla Firefox"', function(){
      var value = env['brandName7'].toString();
      value.should.equal("Mozilla Firefox");
    });
  });
});
