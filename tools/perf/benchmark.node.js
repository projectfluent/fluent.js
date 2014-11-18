var fs = require('fs');

var L20n = require('../../lib/l20n');
var Context = require('../../lib/l20n/context').Context;

var parser = L20n.PropertiesParser;
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

var ast = parser.parse(null, code);
cumulative.parseEnd = process.hrtime(start);


cumulative.createEntries = process.hrtime(start);
L20n.extendEntries(env, ast);
cumulative.createEntriesEnd = process.hrtime(start);

var ids = Object.keys(env).filter(function(id){return id !== '__plural';});

cumulative.format = process.hrtime(start);
for (var id in ids) {
  L20n.Resolver.format(data, env[ids[id]]);
}
cumulative.formatEnd = process.hrtime(start);

var ctx = new Context(null);
var locale = ctx.getLocale('en-US');
locale.addAST(ast);
ctx.requestLocales(['en-US']);

cumulative.getEntity = process.hrtime(start);
for (var id in ids) {
  ctx.getEntity(ids[id], data);
}
cumulative.getEntityEnd = process.hrtime(start);

var results = {
  parse: micro(cumulative.parseEnd),
  createEntries: micro(cumulative.createEntriesEnd) - micro(cumulative.createEntries),
  format: micro(cumulative.formatEnd) - micro(cumulative.format),
  getEntity: micro(cumulative.getEntityEnd) - micro(cumulative.getEntity)
};
console.log(JSON.stringify(results));
