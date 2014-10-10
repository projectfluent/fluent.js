var fs = require('fs');

var L20n = require('../../lib/l20n');

var parser = new L20n.PropertiesParser();
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
L20n.createEntries(ast);
cumulative.createEntriesEnd = process.hrtime(start);

cumulative.format = process.hrtime(start);
for (var id in env) {
  L20n.Resolver.formatEntity(env[id], data);
}
cumulative.formatEnd = process.hrtime(start);

var results = {
  parse: micro(cumulative.parseEnd),
  createEntries: micro(cumulative.createEntriesEnd) - micro(cumulative.createEntries),
  format: micro(cumulative.formatEnd) - micro(cumulative.format)
};
console.log(JSON.stringify(results));
