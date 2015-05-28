var fs = require('fs');

var L20n = require('../../src/bindings/node');
var Context = require('../../src/lib/context').Context;

var propParser = L20n.PropertiesParser;
var l20nParser = L20n.L20nParser;
var env = {
  __plural: L20n.getPluralRule('en-US')
};

var propCode = fs.readFileSync(__dirname + '/example.properties').toString();
var l20nCode = fs.readFileSync(__dirname + '/example.l20n').toString();

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

var ast = propParser.parse(null, propCode);
cumulative.parseEnd = process.hrtime(start);

cumulative.l20nParseStart = process.hrtime(start);

var ast = l20nParser.parse(null, l20nCode);
cumulative.l20nParseEnd = process.hrtime(start);

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
  propParse: micro(cumulative.parseEnd),
  l20nParse: micro(cumulative.l20nParseEnd) - micro(cumulative.l20nParseStart),
  createEntries: micro(cumulative.createEntriesEnd) - micro(cumulative.createEntries),
  format: micro(cumulative.formatEnd) - micro(cumulative.format),
  getEntity: micro(cumulative.getEntityEnd) - micro(cumulative.getEntity)
};
console.log(JSON.stringify(results));
