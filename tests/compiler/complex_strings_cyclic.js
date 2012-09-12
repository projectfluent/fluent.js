var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../_build/cov/lib/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Cyclic references', function(){
  var filename = 'complex_strings_cyclic.json';
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

  describe('Nested reference, but not cyclic', function(){
    it('returns "About Mozilla Firefox"', function(){
      var value = env.entries['about1'].toString();
      value.should.equal("About Mozilla Firefox");
    });
  });
  describe('Cyclic reference', function(){
    it('throws an error', function(){
      (function() {
        var value = env.entries['about2'].toString();
      }).should.throw('Cyclic reference detected');
    });
  });
  describe('Cyclic self-reference (recursion)', function(){
    it('throws an error', function(){
      (function() {
        var value = env.entries['about3'].toString();
      }).should.throw('Cyclic reference detected');
    });
  });
  describe('Non-cyclic self-reference inside of a hash', function(){
    it('returns About Firefox for {{ brandName.release }}', function(){
      var value = env.entries['about41'].toString();
      value.should.equal("About Firefox");
    });
    it('returns About Firefox for {{ brandName }}', function(){
      var value = env.entries['about42'].toString();
      value.should.equal("About Firefox");
    });
    it('returns About Firefox for {{ ~.release }}', function(){
      var value = env.entries['about43'].toString();
      value.should.equal("About Firefox");
    });
    it('returns About Firefox for {{ ~ }}', function(){
      var value = env.entries['about44'].toString();
      value.should.equal("About Firefox");
    });
  });
  describe('Cyclic self-reference inside of a hash', function(){
    it('throws an error for {{ brandName.beta }}', function(){
      (function() {
        var value = env.entries['about51'].toString();
      }).should.throw('Cyclic reference detected');
    });
    it('throws an error for {{ ~.beta }}', function(){
      (function() {
        var value = env.entries['about52'].toString();
      }).should.throw('Cyclic reference detected');
    });
  });
});
