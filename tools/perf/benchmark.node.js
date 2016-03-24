var fs = require('fs');

require('babel-register')({
  presets: ['es2015']
});
var L20n = require('../../src/runtime/node');
var Context = require('../../src/lib/context').Context;

var propCode = fs.readFileSync(__dirname + '/example.properties').toString();
var l20nCode = fs.readFileSync(__dirname + '/example.l20n').toString();
var ftlCode = fs.readFileSync(__dirname + '/example.ftl').toString();

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
  "link2": "LINK2",
  "count": 10,
};

var lang = {
  code:'en-US',
  src: 'app',
};
function micro(time) {
  // time is [seconds, nanoseconds]
  return Math.round((time[0] * 1e9 + time[1]) / 1000);
}

var cumulative = {};
var start = process.hrtime();

var entries = L20n.PropertiesParser.parse(null, propCode);
cumulative.parseEnd = process.hrtime(start);

cumulative.l20nParseStart = process.hrtime(start);

var entries = L20n.L20nParser.parse(null, l20nCode);
cumulative.l20nParseEnd = process.hrtime(start);

cumulative.ftlParseStart = process.hrtime(start);

var entries = L20n.FTLParser.parseResource(ftlCode);
cumulative.ftlParseEnd = process.hrtime(start);
/*
var ctx = new L20n.MockContext(entries);

cumulative.format = process.hrtime(start);
for (var id in entries) {
  L20n.format(ctx, lang, data, entries[id]);
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
*/
var results = {
  propParse: micro(cumulative.parseEnd),
  l20nParse: micro(cumulative.l20nParseEnd) - micro(cumulative.l20nParseStart),
  ftlParse: micro(cumulative.ftlParseEnd) - micro(cumulative.ftlParseStart),
  //format: micro(cumulative.formatEnd) - micro(cumulative.format),
  //getEntity: micro(cumulative.getEntityEnd) - micro(cumulative.getEntity)
};
console.log(JSON.stringify(results));
