var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Nested hash', function(){
  var filename = 'nested_hashes.json';
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

  describe('with no index and no default value', function(){
    it('is "Firefox"', function(){
      var value = env.entries['brandName21'].toString();
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['foo', 'bar']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine"]', function(){
      var value = env.entries['brandName21']._resolve({}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['masculine', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = env.entries['brandName21']._resolve({}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = env.entries['brandName21']._resolve({}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed an index of ["feminine"]', function(){
      var value = env.entries['brandName21']._resolve({}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['feminine', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = env.entries['brandName21']._resolve({}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = env.entries['brandName21']._resolve({}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName21']._resolve({}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with no index and default values on the second level', function(){
    it('is "Firefox\'s"', function(){
      var value = env.entries['brandName22'].toString();
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['foo', 'bar']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine"]', function(){
      var value = env.entries['brandName22']._resolve({}, ['masculine']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['masculine', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = env.entries['brandName22']._resolve({}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = env.entries['brandName22']._resolve({}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine"]', function(){
      var value = env.entries['brandName22']._resolve({}, ['feminine']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['feminine', 'foo']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = env.entries['brandName22']._resolve({}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = env.entries['brandName22']._resolve({}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName22']._resolve({}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of ["feminine"] and no defaults', function(){
    it('is "Aurora"', function(){
      var value = env.entries['brandName23'].toString();
      value.should.equal('Aurora');
    });
    it('is "Firefox\'s" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['foo', 'bar']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine"]', function(){
      var value = env.entries['brandName23']._resolve({}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['masculine', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = env.entries['brandName23']._resolve({}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = env.entries['brandName23']._resolve({}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine"]', function(){
      var value = env.entries['brandName23']._resolve({}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['feminine', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = env.entries['brandName23']._resolve({}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = env.entries['brandName23']._resolve({}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName23']._resolve({}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of ["feminine", "genitive"] and no defaults', function(){
    it('is "Aurora\'s"', function(){
      var value = env.entries['brandName24'].toString();
      value.should.equal('Aurora\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['foo', 'bar']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine"]', function(){
      var value = env.entries['brandName24']._resolve({}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['masculine', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = env.entries['brandName24']._resolve({}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = env.entries['brandName24']._resolve({}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine"]', function(){
      var value = env.entries['brandName24']._resolve({}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['feminine', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = env.entries['brandName24']._resolve({}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = env.entries['brandName24']._resolve({}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = env.entries['brandName24']._resolve({}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
});
