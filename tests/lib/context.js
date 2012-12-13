//var L20n = process.env.L20N_COV
//  ? require('../../_build/cov/lib/l20n.js')
//  : require('../../lib/l20n.js');

var L20n = require('../../lib/l20n-old.js');
L20n.EventEmitter = require('../../lib/events.js').EventEmitter;
L20n.Parser = require('../../lib/parser.js').Parser;
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
        url = localhost + '/locales/' + url;
      }
    } else {
      if (!L20n.env.scenario) {
        throw "Define L20n.env.scenario for this scenario";
      }
      var url = 'file://'+__dirname+'/../fixtures/sets/' + L20n.env.scenario + url;
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
  console.log(filePath);

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
    //L20n.invalidateCache();
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
      server.rules['/locales/en-US/a.lol'] = function(serve) {
        setTimeout(serve, 300);
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
      server.rules['/locales/en-US/a.lol'] = function(serve) {
        setTimeout(serve, 1000);
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

  xdescribe('Simple scheme URL', function(){
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

  xdescribe('Locale fallback', function(){
    before(function() {
      server.scenario = 'no_imports';
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
      ctx.freeze();
      ctx.get('a', {}, function(value) {
        value.should.equal('A (en-US)');
        done();
      }, 'A');
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
      ctx.freeze();
      ctx.get('b', {}, function(value) {
        value.should.equal('B (en-US)');
        done();
      }, 'B');
    });
  });

  xdescribe('Simple import', function(){
    before(function() {
      server.scenario = 'simple_import';
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
      ctx.freeze();
      ctx.get('c', {}, function(value) {
        value.should.equal('C (en-US)');
        done();
      }, 'C');
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
        ctx.get('a').should.equal('A (en-US)')
        ctx.get('c').should.equal('C (en-US)')
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

