//var L20n = process.env.L20N_COV
//  ? require('../../_build/cov/lib/l20n.js')
//  : require('../../lib/l20n.js');

var L20n = require('../../lib/l20n.js').L20n;
L20n.EventEmitter = require('../../lib/events.js').EventEmitter;
L20n.Parser = require('../../lib/parser.js').Parser;
L20n.Compiler = require('../../lib/compiler.js').Compiler;
L20n.Compiler = new L20n.Compiler(L20n.EventEmitter, L20n.Parser);
var http = require('http');
var path = require('path');
var fs = require('fs');

var env = {
  DEBUG: true,
  getURL: function getURL(url, async) {
    if (async === undefined) {
      async = true;
    }

    if (async) {
      var localhost = 'http://localhost:8357';
      if (url[0] == '/') {
        url = localhost + url;
      } else if (!/localhost:8357/.test(url)) {
        url = localhost + '/'+ url;
      }
    } else {
      if (!L20n.env.scenario) {
        throw "Define L20n.env.scenario for this scenario";
      }
      if (!/file:\/\/\//.test(url)) {
        var url = 'file://'+__dirname+'/../fixtures/sets/' + L20n.env.scenario + url;
      }
    }
    return url;
  },
  XMLHttpRequest: require("xmlhttprequest").XMLHttpRequest,
}

L20n.env = env;

// node's XHR doesn't support overrideMimeType; make it no-op for now
env.XMLHttpRequest.prototype.overrideMimeType = function() {};

function handleRequest(request, response) {
  var url = request.url.split('?')[0];
  var filePath = './tests/fixtures/sets/' + this.scenario + url;

  function serve(err) {
    if (err) {
      response.writeHead(err);
      response.end();
      return;
    }
    fs.exists(filePath, function(exists) {
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
  var server;

  before(function() {
    server = http.createServer(handleRequest);
  });

  beforeEach(function() {
    server.listen(8357);
    server.rules = {};
  });

  afterEach(function() {
    server.close();
    L20n.env.scenario = null;
  });

  describe('Hardcoded URL', function(){
    before(function() {
      server.scenario = 'no_imports';
    });
    it('works for en-US', function(done) {
      var ctx = L20n.getContext();
      ctx.addResource('locales/en-US/a.lol');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (en-US)');
        done();
      });
      ctx.freeze();
    });
    it('works for pl', function(done) {
      var ctx = L20n.getContext();
      ctx.addResource('locales/pl/a.lol');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (pl)');
        done();
      });
      ctx.freeze();
    });
    it('works with 300ms delay', function(done) {
      server.rules['/locales/en-US/a.lol'] = function(serve) {
        setTimeout(serve, 300);
      };
      var ctx = L20n.getContext();
      ctx.addResource('locales/en-US/a.lol');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (en-US)');
        done();
      });
      ctx.freeze();
    });
    it('uses the default value if delay is 1000ms', function(done) {
      server.rules['/locales/en-US/a.lol'] = function(serve) {
        setTimeout(serve, 1000);
      };
      var ctx = L20n.getContext();
      ctx.addResource('locales/en-US/a.lol');
      ctx.addEventListener('ready', function() {
        var values = ctx.get('a');
        value.should.equal('A');
        done();
      });
      ctx.freeze();
      ctx.getMany(['a'], {}).then(
        function() {},
        function() {
          done();
        });
    });
  });

  xdescribe('Simple scheme URL', function(){
    before(function() {
      server.scenario = 'no_imports';
    });
    it('works for en-US for absolute URLs', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['en-US'];
      ctx.addResource('l10n:/locales/{{ locale }}/a.lol');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (en-US)');
        done();
      });
      ctx.freeze();
    });
  });

  xdescribe('Complex scheme URL', function(){
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
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (en-US)');
        done();
      });
      ctx.freeze();
    });
    it('uses the second URL if the first one cannot be fetched', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['en-US'];
      ctx.settings.schemes = [
        '/wrongdir/{{ locale }}/{{ resource }}.lol',
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (en-US)');
        done();
      });
      ctx.freeze();
    });
  });

  xdescribe('Locale fallback', function(){
    before(function() {
      server.scenario = 'no_imports';
      L20n.env.scenario = 'no_imports';
    });
    it('uses en-US when the first locale is not integral', function(done) {
      server.rules['/locales/pl/a.lol'] = function(serve) {
        serve(404);
      };
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('a');
        value.should.equal('A (en-US)');
        done();
      });
      ctx.freeze();
    });
    // add a testcase for when none of the locales is integral
  });

  xdescribe('Entity fallback', function(){
    before(function() {
      server.scenario = 'no_imports';
      L20n.env.scenario = 'no_imports';
    });
    it('uses en-US translation when the Polish one is missing', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('b');
        value.should.equal('B (en-US)');
        done();
      });
      ctx.freeze();
    });
  });

  xdescribe('Simple import', function(){
    before(function() {
      server.scenario = 'simple_import';
      L20n.env.scenario = 'simple_import';
    });
    xit('works', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('c');
        value.should.equal('C (pl)');
        done();
      });
      ctx.freeze();
    });
    it('when 404, ctx fallbacks to next locale', function(done) {
      server.rules['/locales/pl/c.lol'] = function(serve) {
        serve(404);
      };
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.addEventListener('ready', function() {
        var value = ctx.get('c');
        value.should.equal('C (en-US)');
        done();
      });
      ctx.freeze();
    });
  });

  xdescribe('Recursive import', function(){
    before(function() {
      server.scenario = 'recursive_imports';
    });
    it('works', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addEventListener('error', function(e) {
        e.code.should.equal(L20n.NESTED_ERROR | L20n.INTEGRITY_ERROR);
      });
      ctx.addEventListener('ready', function(e) {
        ctx.get('a').should.equal('A (pl)')
        ctx.get('c').should.equal('C (pl)')
        done();
      });
      ctx.addResource('l10n:a')
      ctx.freeze();
    })
  });

  xdescribe('Duplicate import', function(){
    before(function() {
      server.scenario = 'duplicate_imports';
    });
    it('works', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.freeze();
      ctx.get('c', {}, function(value) {
        value.should.equal('C (pl)');
        done();
      }, 'C');
    });
    it('when 404, fallbacks to next locale', function(done) {
      server.rules['/locales/pl/c.lol'] = function(serve) {
        serve(404);
      };
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.freeze();
      ctx.get('c', {}, function(value) {
        value.should.equal('C (en-US)');
        done();
      }, 'C');
    });
    it('works when the imported res is addResource\'d directly to the ctx first', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:c');
      ctx.addResource('l10n:a');
      ctx.freeze();
      ctx.get('c', {}, function(value) {
        value.should.equal('C (pl)');
        done();
      }, 'C');
    });
  });

  xdescribe('Broken lol', function(){
    before(function() {
      server.scenario = 'broken_lol';
      L20n.env.scenario = 'broken_lol';
    });
    it('works', function(done) {
      var ctx = L20n.getContext();
      ctx.settings.locales = ['pl', 'en-US'];
      ctx.settings.schemes = [
        '/locales/{{ locale }}/{{ resource }}.lol'
      ];
      ctx.addResource('l10n:a');
      ctx.freeze();
      ctx.addEventListener('error', function(e) {
        console.log(e)
      });
      ctx.addEventListener('ready', function() {
        ctx.get('a').should.equal('A (pl)')
        ctx.get('c').should.equal('C (pl)')
        ctx.get('b').should.equal('B (en-US)')
        try {
          var x = ctx.get('d');
          // that's not what should happen in this case...
          // and it'll work only once we fix the sync file loading here
        } catch (e) {
          if (e == "No valid locales were available.") {
            done();
          }
        }
      });
    })
  });

  // TODO: test fallback on parsing errors
  // TODO: test that two fallbacks invalidate ctx only once

});

