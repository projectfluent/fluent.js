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
  var filename = 'ctxdata.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });
  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('Passing a primitive value and using it in a complexString', function(){
    it('returns "Unread notifications: 7"', function(){
      var value = env['unread'].toString({
        unreadNotifications: 7,
      });
      value.should.equal('Unread notifications: 7');
    });
  });
  describe('Passing a primitive value and using it in an index', function(){
    it('returns "One unread notification"', function(){
      var value = env['unreadPlural'].toString({
        unreadNotifications: 1,
      });
      value.should.equal('One unread notification');
    });
    it('returns "7 unread notifications"', function(){
      var value = env['unreadPlural'].toString({
        unreadNotifications: 7,
      });
      value.should.equal('7 unread notifications');
    });
  });
  describe('Passing an object and using it in a complexString', function(){
    it('returns "Hello Joe!"', function(){
      var value = env['hello'].toString({
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
      var value = env['helloLast'].toString({
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
