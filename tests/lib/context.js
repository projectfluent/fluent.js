var L20n = process.env.L20N_COV
  ? require('../../_build/cov/lib/l20n.js')
  : require('../../lib/l20n.js');

var http = require('http');
var path = require('path');
var fs = require('fs');

function handleRequest(request, response) {
  var url = request.url.split('?')[0];
  var filePath = './tests/fixtures/sets/' + this.scenario + url;

  function serve(err) {
    if (err) {
      response.writeHead(err);
      response.end();
      return;
    }
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

// The LOL files are located in:
// /tests/fixtures/sets/SCENARIO/locales/LOCALE/
//                              ^       ^
//                              |       |
//        this is the server root       |
//                                      from here the ctx methods are called
//
// This means all of the following will work:
//
//   ctx.addResource('en-US/base.lol');
//   ctx.addResource('/locales/en-US/base.lol');
//   ctx.addResource('../locales/en-US/base.lol');
//
// With `ctx.settings.locales` set:
//
//   ctx.addResource('l10n:{{ locale }}/base.lol');
//   ctx.addResource('l10n:/locales/{{ locale }}/base.lol');
//
// With `ctx.settings.schemes` set:
//
//   ctx.settings.schemes = [
//     '/locales/{{ locale }}/{{ resource }}.lol',
//     '{{ locale }}/{{ resource }}.lol',
//     '../locales/{{ locale }}/{{ resource }}.lol',
//   ];
//   ctx.addResource('l10n:base');
//
// Or even like so:
//
//   ctx.settings.schemes = [
//     '/locales/{{ locale }}/{{ app }}/{{ resource }}.lol',
//   ];
//   ctx.addResource('l10n:browser:base');

describe('L20n context', function(){
  var server = http.createServer(handleRequest).listen(8357);

  beforeEach(function() {
    server.rules = {};
    L20n.invalidateCache();
  });

  describe('Hardcoded URL', function(){
    before(function() {
      server.scenario = 'no_imports';
    });
    it('works for en-US', function(done) {
      var ctx = L20n.getContext();
      ctx.addResource('en-US/a.lol');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
    it('works for pl', function(done) {
      var ctx = L20n.getContext();
      ctx.addResource('pl/a.lol');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (pl)');
        done();
      }, 'A');
    });
    it('works with 300ms delay', function(done) {
      server.rules['/locales/en-US/a.lol'] = function(next) {
        setTimeout(next, 300);
      };
      var ctx = L20n.getContext();
      ctx.addResource('en-US/a.lol');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
    it('uses the default value if delay is 1000ms', function(done) {
      server.rules['/locales/en-US/a.lol'] = function(next) {
        setTimeout(next, 1000);
      };
      var ctx = L20n.getContext();
      ctx.addResource('en-US/a.lol');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A');
        done();
      }, 'A');
    });
  });

  describe('Simple scheme URL', function(){
    before(function() {
      server.scenario = 'no_imports';
    });
    it('works for en-US', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['en-US'];
      ctx.addResource('l10n:{{ locale }}/a.lol');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
    it('works for en-US for absolute URLs', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['en-US'];
      ctx.addResource('l10n:/locales/{{ locale }}/a.lol');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
  });

  describe('Complex scheme URL', function(){
    before(function() {
      server.scenario = 'no_imports';
    });
    it('works when the first URL is 200', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
    it('uses the second URL if the first one cannot be fetched', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['en-US'];
      ctx.settings.schemes = [
        '/wrongdir/{{ locale }}/{{ resource }}.lol',
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
    });
  });

});
