var fs = require('fs');

var L20n = require('../../lib/l20n');
var Parser = require('../../lib/l20n/parser').Parser;
var Compiler = require('../../lib/l20n/compiler').Compiler;
var RetranslationManager = require('../../lib/l20n/retranslation').RetranslationManager;
require('../../lib/l20n/platform/globals');

var parser = new Parser(true); 
var compiler = new Compiler();
var retr = new RetranslationManager();

compiler.setGlobals(retr.globals);

var code = fs.readFileSync(__dirname + '/example.lol').toString();
var data = {
  "ssid": "SSID",
  "capabilities": "CAPABILITIES",
  "linkSpeed": "LINKSPEED",
  "pin": "PIN",
  "n": 3,
  "name": "NAME",
  "device": "DEVICE",
  "code": "CODE",
  "app": "APP",
  "size": "SIZE",
  "unit": "UNIT",
  "list": "LIST",
  "level": "LEVEL",
  "number": "NUMBER",
  "link1": "LINK1",
  "link2": "LINK2"
}
var ast = parser.parse(code);
var env = compiler.compile(ast);
var ids = [];
for (var id in env) {
  if (env[id].get) {
    ids.push(id);
  }
}

function micro(time) {
  // time is [seconds, nanoseconds]
  return Math.round((time[0] * 1e9 + time[1]) / 1000);
}

var cumulative = {};
var start = process.hrtime();

parser.parse(code);
cumulative.parse = process.hrtime(start);

compiler.compile(ast);
cumulative.compile = process.hrtime(start);

for (var i = 0, len = ids.length; i < len; i++) {
   env[ids[i]].get(data);
}
cumulative.get = process.hrtime(start);

var ctx = L20n.getContext();
ctx.ready(printResults);
//ctx.addResource('<foo "Foo">');
ctx.linkResource(__dirname + '/foo.lol');
ctx.requestLocales();

function printResults() {
  cumulative.ready = process.hrtime(start);
  var results = {
    parse: micro(cumulative.parse),
    compile: micro(cumulative.compile) - micro(cumulative.parse),
    get: micro(cumulative.get) - micro(cumulative.compile),
    ready: micro(cumulative.ready) - micro(cumulative.get),
  };
  console.log(JSON.stringify(results));
}
