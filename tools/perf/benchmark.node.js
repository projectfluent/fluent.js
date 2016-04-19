var fs = require('fs');

require('babel-register')({
  presets: ['es2015']
});
var L20n = require('../../src/runtime/node');
var Context = require('../../src/lib/context').Context;

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

cumulative.ftlParseStart = process.hrtime(start);
var ast = L20n.FTLASTParser.parseResource(ftlCode);
cumulative.ftlParseEnd = process.hrtime(start);

cumulative.ftlEntriesParseStart = process.hrtime(start);
var entries = L20n.FTLEntriesParser.parseResource(ftlCode);
cumulative.ftlEntriesParseEnd = process.hrtime(start);

var entries = L20n.createEntriesFromAST(ast).entries;
var ctx = new L20n.MockContext(entries);

cumulative.format = process.hrtime(start);
for (var id in entries) {
  L20n.format(ctx, lang, data, entries[id]);
}
cumulative.formatEnd = process.hrtime(start);

var results = {
  ftlParse: micro(cumulative.ftlParseEnd) - micro(cumulative.ftlParseStart),
  ftlEntriesParse: micro(cumulative.ftlEntriesParseEnd) - micro(cumulative.ftlEntriesParseStart),
  format: micro(cumulative.formatEnd) - micro(cumulative.format),
};
console.log(JSON.stringify(results));
