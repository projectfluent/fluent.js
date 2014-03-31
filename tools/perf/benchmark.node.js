var fs = require('fs');

var L20n = require('../../lib/l20n');

var parser = new L20n.Parser();
var env = {
  __plural: L20n.getPluralRule('en-US')
};

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

cumulative.compile = process.hrtime(start);
L20n.compile(ast, env);
cumulative.compileEnd = process.hrtime(start);

cumulative.get = process.hrtime(start);
for (var id in env) {
   env[id].valueOf(data);
}
cumulative.getEnd = process.hrtime(start);

cumulative.ready = process.hrtime(start);
var ctx = L20n.getContext();
ctx.ready(printResults);
ctx.resLinks.push(__dirname + '/foo.properties');
ctx.requestLocales('en-US');

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
