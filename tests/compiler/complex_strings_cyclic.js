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

describe('Cyclic references', function(){
  var filename = 'complex_strings_cyclic.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('Nested reference, but not cyclic', function(){
    it('returns "About Mozilla Firefox"', function(){
      var value = env['about1'].toString();
      value.should.equal("About Mozilla Firefox");
    });
  });
  describe('Cyclic reference', function(){
    it('throws an error', function(){
      (function() {
        var value = env['about2'].toString();
      }).should.throw('Cyclic reference detected');
    });
  });
  describe('Cyclic self-reference (recursion)', function(){
    it('throws an error', function(){
      (function() {
        var value = env['about3'].toString();
      }).should.throw('Cyclic reference detected');
    });
  });
  describe('Non-cyclic self-reference inside of a hash', function(){
    it('returns About Firefox for {{ brandName.release }}', function(){
      var value = env['about41'].toString();
      value.should.equal("About Firefox");
    });
    it('returns About Firefox for {{ brandName }}', function(){
      var value = env['about42'].toString();
      value.should.equal("About Firefox");
    });
    it('returns About Firefox for {{ ~.release }}', function(){
      var value = env['about43'].toString();
      value.should.equal("About Firefox");
    });
    it('returns About Firefox for {{ ~ }}', function(){
      var value = env['about44'].toString();
      value.should.equal("About Firefox");
    });
  });
  describe('Cyclic self-reference inside of a hash', function(){
    it('throws an error for {{ brandName.beta }}', function(){
      (function() {
        var value = env['about51'].toString();
      }).should.throw('Cyclic reference detected');
    });
    it('throws an error for {{ ~.beta }}', function(){
      (function() {
        var value = env['about52'].toString();
      }).should.throw('Cyclic reference detected');
    });
  });
});
