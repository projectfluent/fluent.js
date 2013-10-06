var fs = require('fs');

var L20n = require('../../lib/l20n');
var Parser = require('../../lib/l20n/parser').Parser;
var Compiler = require('../../lib/l20n/compiler').Compiler;
var getPluralRule = require('../../lib/l20n/plurals').getPluralRule;

var parser = new Parser(true); 
var compiler = new Compiler();

var code = fs.readFileSync(__dirname + '/example.properties').toString();
var data = {
  "brandShortName": "BRANDSHORTNAME",
  "ssid": "SSID",
  "capabilities": "CAPABILITIES",
  "linkSpeed": "LINKSPEED",
  "pin": "PIN",
  "n": 3,
  "name": "NAME",
  "device": "DEVICE",
  "code": "CODE",
  "app": "APP",
  "size": 100,
  "unit": "UNIT",
  "list": "LIST",
  "level": "LEVEL",
  "number": "NUMBER",
  "link1": "LINK1",
  "link2": "LINK2"
}

function micro(time) {
  // time is [seconds, nanoseconds]
  return Math.round((time[0] * 1e9 + time[1]) / 1000);
}

var cumulative = {};
var start = process.hrtime();

var ast = parser.parse(code);
cumulative.parseEnd = process.hrtime(start);

ast.body['plural'] = {
  type: 'Macro',
  args: [{
    type: 'Identifier',
    name: 'n'
  }],
  expression: getPluralRule('en-US')
};

cumulative.compile = process.hrtime(start);
var env = compiler.compile(ast);
cumulative.compileEnd = process.hrtime(start);

var ids = [];
for (var id in env) {
  if (env[id].get) {
    ids.push(id);
  }
}

cumulative.get = process.hrtime(start);
for (var i = 0, len = ids.length; i < len; i++) {
   env[ids[i]].get(data);
}
cumulative.getEnd = process.hrtime(start);

cumulative.ready = process.hrtime(start);
var ctx = L20n.getContext();
ctx.ready(printResults);
//ctx.addResource('<foo "Foo">');
ctx.linkResource(__dirname + '/foo.properties');
ctx.registerLocales('en-US');
ctx.requestLocales();

function printResults() {
  cumulative.readyEnd = process.hrtime(start);
  var results = {
    parse: micro(cumulative.parseEnd),
    compile: micro(cumulative.compileEnd) - micro(cumulative.compile),
    get: micro(cumulative.getEnd) - micro(cumulative.get),
    ready: micro(cumulative.readyEnd) - micro(cumulative.ready),
  };
  console.log(JSON.stringify(results));
}
