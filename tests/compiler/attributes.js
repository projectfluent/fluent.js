var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Attributes', function(){
  var filename = 'attributes.json';
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

  describe('Basic attribute call', function(){
    it('returns "About Mozilla Firefox"', function(){
      var value = env.entries['about1'].toString();
      value.should.equal("About Mozilla Firefox");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env.entries['about2'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env.entries['about2Win'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Linux"', function(){
      var value = env.entries['about2Linux'].toString();
      value.should.equal("About Firefox on Linux");
    });
  });
  describe('"This" expression (~) used in an attribute', function(){
    it('returns "About Mozilla Firefox"', function(){
      var value = env.entries['about3'].toString();
      value.should.equal("About Mozilla Firefox");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env.entries['about4'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Windows"', function(){
      var value = env.entries['about4Win'].toString();
      value.should.equal("About Firefox on Windows");
    });
    it('returns "About Firefox on Linux"', function(){
      var value = env.entries['about4Linux'].toString();
      value.should.equal("About Firefox on Linux");
    });
  });
  describe('"This" expression (~) used in the value to reference an attribute', function(){
    it('returns "Mozilla Firefox"', function(){
      var value = env.entries['brandName7'].toString();
      value.should.equal("Mozilla Firefox");
    });
  });
});
