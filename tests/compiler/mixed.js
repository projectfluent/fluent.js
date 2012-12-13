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

describe('Mixed examples', function(){
  var filename = 'mixed.lol';
  var ast, env;

  before(function() {
    ast = read(filename);
  });

  beforeEach(function() {
    env = compiler.compile(ast);
  });

  describe('Update successfull', function(){
    it('reads "Aurora została zaktualizowana."', function(){
      var value = env['updated'].toString();
      value.should.equal('Aurora została zaktualizowana.');
    });
  });
  describe('Unread messages notification', function(){
    it('', function(){
      var value = env['unreadMessages'].toString({ unreadCount: 0});
      value.should.equal('Masz 0 nowych wiadomości');
    });
    it('', function(){
      var value = env['unreadMessages'].toString({ unreadCount: 1});
      value.should.equal('Masz 1 nową wiadomość');
    });
    it('', function(){
      var value = env['unreadMessages'].toString({ unreadCount: 2});
      value.should.equal('Masz 2 nowe wiadomości');
    });
    it('', function(){
      var value = env['unreadMessages'].toString({ unreadCount: 5});
      value.should.equal('Masz 5 nowych wiadomości');
    });
  });
  describe('Unread messages notification with a user-friendly case for zero', function(){
    it('', function(){
      var value = env['unreadMessagesZero'].toString({ unreadCount: 0});
      value.should.equal('Nie masz nowych wiadomości');
    });
    it('', function(){
      var value = env['unreadMessagesZero'].toString({ unreadCount: 1});
      value.should.equal('Masz 1 nową wiadomość');
    });
    it('', function(){
      var value = env['unreadMessagesZero'].toString({ unreadCount: 2});
      value.should.equal('Masz 2 nowe wiadomości');
    });
    it('', function(){
      var value = env['unreadMessagesZero'].toString({ unreadCount: 5});
      value.should.equal('Masz 5 nowych wiadomości');
    });
  });
});
