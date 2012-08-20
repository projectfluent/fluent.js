var fs = require('fs');
var Compiler = process.env.L20N_COV
  ? require('../../lib-cov/compiler.js')
  : require('../../lib/compiler.js');

function read(filename) {
  var fixtures = './tests/fixtures/json/';
  return JSON.parse(fs.readFileSync(fixtures + filename)).body;
}

describe('Mixed examples', function(){
  var filename = 'mixed.json';
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

  describe('Update successfull', function(){
    it('reads "Aurora została zaktualizowana."', function(){
      var value = env.entries['updated'].toString();
      value.should.equal('Aurora została zaktualizowana.');
    });
  });
  describe('Unread messages notification', function(){
    it('', function(){
      var value = env.entries['unreadMessages'].toString({ unreadCount: 0});
      value.should.equal('Masz 0 nowych wiadomości');
    });
    it('', function(){
      var value = env.entries['unreadMessages'].toString({ unreadCount: 1});
      value.should.equal('Masz 1 nową wiadomość');
    });
    it('', function(){
      var value = env.entries['unreadMessages'].toString({ unreadCount: 2});
      value.should.equal('Masz 2 nowe wiadomości');
    });
    it('', function(){
      var value = env.entries['unreadMessages'].toString({ unreadCount: 5});
      value.should.equal('Masz 5 nowych wiadomości');
    });
  });
  describe('Unread messages notification with a user-friendly case for zero', function(){
    it('', function(){
      var value = env.entries['unreadMessagesZero'].toString({ unreadCount: 0});
      value.should.equal('Nie masz nowych wiadomości');
    });
    it('', function(){
      var value = env.entries['unreadMessagesZero'].toString({ unreadCount: 1});
      value.should.equal('Masz 1 nową wiadomość');
    });
    it('', function(){
      var value = env.entries['unreadMessagesZero'].toString({ unreadCount: 2});
      value.should.equal('Masz 2 nowe wiadomości');
    });
    it('', function(){
      var value = env.entries['unreadMessagesZero'].toString({ unreadCount: 5});
      value.should.equal('Masz 5 nowych wiadomości');
    });
  });
});
