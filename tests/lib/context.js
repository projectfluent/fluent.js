var L20n = process.env.L20N_COV
  ? require('../../_build/cov/lib/l20n.js')
  : require('../../lib/l20n.js');

var http = require('http');
var path = require('path');
var fs = require('fs');

function handleRequest(request, response) {
  var url = request.url.split('?')[0];
  var filePath = './tests/fixtures/sets/' + this.prefix + url;

  function serve() {
    path.exists(filePath, function(exists) {
      if (exists) {
        fs.readFile(filePath, function(error, content) {
          if (error) {
            response.writeHead(500);
            response.end();
          } else {
            response.writeHead(200, { 'Content-Type': 'plain/text' });
            response.end(content, 'utf-8');
          }
        });
      } else {
        response.writeHead(404);
        response.end();
      }
    });
  }

  if (this.rules[url]) {
    this.rules[url](serve);
  } else {
    serve();
  }
}

function local(path) {
  return 'http://localhost:8357/' + path + '?' + Date.now();
}

describe('L20n context', function(){
  var server;
  var ctx;

  before(function() {
    server = http.createServer(handleRequest);
    server.listen(8357);
  });

  beforeEach(function() {
    server.rules = {};
    ctx = L20n.getContext();
  });

  describe('Hardcoded URL', function(){
    before(function() {
      server.prefix = 'no_imports';
    });
    it('works for en-US', function(done) {
      ctx.addResource(local('en-US/a.lol'));
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
    it('works for pl', function(done) {
      ctx.addResource(local('pl/a.lol'));
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (pl)');
        done();
      }, 'A');
    });
    it('works with 300ms delay', function(done) {
      server.rules['/en-US/a.lol'] = function(next) {
        setTimeout(next, 300);
      };
      ctx.addResource(local('en-US/a.lol'));
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
    it('uses the default value if delay is 1000ms', function(done) {
      server.rules['/en-US/a.lol'] = function(next) {
        setTimeout(next, 1000);
      };
      ctx.addResource(local('en-US/a.lol'));
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A');
        done();
      }, 'A');
    });
  });
});
