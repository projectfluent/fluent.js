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
  var obj;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    obj = {};
    Compiler.compile(ast, obj);
  });

  describe('with no index and no default value', function(){
    it('is "Firefox"', function(){
      var value = obj['brandName21'].get(obj);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['foo', 'bar']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine"]', function(){
      var value = obj['brandName21'].get(obj, {}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['masculine', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = obj['brandName21'].get(obj, {}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = obj['brandName21'].get(obj, {}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora" when passed an index of ["feminine"]', function(){
      var value = obj['brandName21'].get(obj, {}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['feminine', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = obj['brandName21'].get(obj, {}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = obj['brandName21'].get(obj, {}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName21'].get(obj, {}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with no index and default values on the second level', function(){
    it('is "Firefox\'s"', function(){
      var value = obj['brandName22'].get(obj);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['foo', 'bar']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine"]', function(){
      var value = obj['brandName22'].get(obj, {}, ['masculine']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['masculine', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = obj['brandName22'].get(obj, {}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = obj['brandName22'].get(obj, {}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine"]', function(){
      var value = obj['brandName22'].get(obj, {}, ['feminine']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['feminine', 'foo']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = obj['brandName22'].get(obj, {}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = obj['brandName22'].get(obj, {}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName22'].get(obj, {}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of ["feminine"] and no defaults', function(){
    it('is "Aurora"', function(){
      var value = obj['brandName23'].get(obj);
      value.should.equal('Aurora');
    });
    it('is "Firefox\'s" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['foo', 'bar']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine"]', function(){
      var value = obj['brandName23'].get(obj, {}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['masculine', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = obj['brandName23'].get(obj, {}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = obj['brandName23'].get(obj, {}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine"]', function(){
      var value = obj['brandName23'].get(obj, {}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['feminine', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = obj['brandName23'].get(obj, {}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = obj['brandName23'].get(obj, {}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName23'].get(obj, {}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
  describe('with an index of ["feminine", "genitive"] and no defaults', function(){
    it('is "Aurora\'s"', function(){
      var value = obj['brandName24'].get(obj);
      value.should.equal('Aurora\'s');
    });
    it('is "Firefox\'s" when passed an index of ["foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['foo', 'bar']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["foo", "bar", "baz"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['foo', 'bar', 'baz']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine"]', function(){
      var value = obj['brandName24'].get(obj, {}, ['masculine']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['masculine', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative"]', function(){
      var value = obj['brandName24'].get(obj, {}, ['masculine', 'nominative']);
      value.should.equal('Firefox');
    });
    it('is "Firefox" when passed an index of ["masculine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['masculine', 'nominative', 'foo']);
      value.should.equal('Firefox');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive"]', function(){
      var value = obj['brandName24'].get(obj, {}, ['masculine', 'genitive']);
      value.should.equal('Firefox\'s');
    });
    it('is "Firefox\'s" when passed an index of ["masculine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['masculine', 'genitive', 'foo']);
      value.should.equal('Firefox\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine"]', function(){
      var value = obj['brandName24'].get(obj, {}, ['feminine']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['feminine', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative"]', function(){
      var value = obj['brandName24'].get(obj, {}, ['feminine', 'nominative']);
      value.should.equal('Aurora');
    });
    it('is "Aurora" when passed an index of ["feminine", "nominative", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['feminine', 'nominative', 'foo']);
      value.should.equal('Aurora');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive"]', function(){
      var value = obj['brandName24'].get(obj, {}, ['feminine', 'genitive']);
      value.should.equal('Aurora\'s');
    });
    it('is "Aurora\'s" when passed an index of ["feminine", "genitive", "foo"]', function(){
      // XXX different in the DEBUG mode
      var value = obj['brandName24'].get(obj, {}, ['feminine', 'genitive', 'foo']);
      value.should.equal('Aurora\'s');
    });
  });
});
