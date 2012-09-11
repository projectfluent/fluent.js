var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../_build/cov/lib/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Complex strings', function(){
  var filename = 'ctxdata.json';
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

  describe('Passing a primitive value and using it in a complexString', function(){
    it('returns "Unread notifications: 7"', function(){
      var value = env.entries['unread'].toString({
        unreadNotifications: 7,
      });
      value.should.equal('Unread notifications: 7');
    });
  });
  describe('Passing a primitive value and using it in an index', function(){
    it('returns "One unread notification"', function(){
      var value = env.entries['unreadPlural'].toString({
        unreadNotifications: 1,
      });
      value.should.equal('One unread notification');
    });
    it('returns "7 unread notifications"', function(){
      var value = env.entries['unreadPlural'].toString({
        unreadNotifications: 7,
      });
      value.should.equal('7 unread notifications');
    });
  });
  describe('Passing an object and using it in a complexString', function(){
    it('returns "Hello Joe!"', function(){
      var value = env.entries['hello'].toString({
        user: {
          name: 'Joe',
          gender: 'male',
        },
      });
      value.should.equal('Hello Joe!');
    });
  });
  describe('Passing a complex object and using it in a complexString', function(){
    it('returns "Hello Mr. Doe!"', function(){
      var value = env.entries['helloLast'].toString({
        user: {
          name: {
            first: 'Joe',
            last: 'Doe',
          },
          gender: 'male',
        },
      });
      value.should.equal('Hello Mr. Doe!');
    });
  });
});
