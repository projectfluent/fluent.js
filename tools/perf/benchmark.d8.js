load('../../dist/bundle/jsshell/l20n.js');

var ftlCode = read('./example.ftl');
var args = {
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

function micro(time) {
  // time is in milliseconds
  return Math.round(time * 1000);
}

var times = {};

times.ftlParseStart = Date.now();
var [resource] = L20n.FTLASTParser.parseResource(ftlCode);
times.ftlParseEnd = Date.now();

times.ftlEntriesParseStart = Date.now();
var [entries] = L20n.FTLEntriesParser.parse(null, ftlCode);
times.ftlEntriesParseEnd = Date.now();

var ctx = new L20n.MessageContext('en-US');
ctx.addMessages(ftlCode);

times.format = Date.now();
for (let id of ctx.messages.keys()) {
  ctx.format(ctx.messages.get(id), args);
}
times.formatEnd = Date.now();

var results = {
  parseFTL: micro(times.ftlParseEnd - times.ftlParseStart),
  parseFTLEntries: micro(times.ftlEntriesParseEnd - times.ftlEntriesParseStart),
  format: micro(times.formatEnd - times.format),
};

print(JSON.stringify(results));
