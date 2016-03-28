load('../../dist/bundle/jsshell/l20n.js');

var propCode = read('./example.properties');
var l20nCode = read('./example.l20n');
var ftlCode = read('./example.ftl');
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
  // time is in milliseconds with decimals
  return Math.round(time * 1000);
}

var times = {};
times.start = dateNow();

var entries = L20n.PropertiesParser.parse(null, propCode);
times.parseEnd = dateNow();

times.l20nParseStart = dateNow();

var entries = L20n.L20nParser.parse(null, l20nCode);
times.l20nParseEnd = dateNow();

times.ftlParseStart = dateNow();

var entries = L20n.FTLParser.parseResource(ftlCode);
times.ftlParseEnd = dateNow();

times.ftlEntriesParseStart = dateNow();

var entries = L20n.FTLEntriesParser.parse(ftlCode);
times.ftlEntriesParseEnd = dateNow();

/*
var ctx = new L20n.MockContext(entries);

times.format = dateNow();
for (var id in entries) {
   L20n.format(ctx, lang, data, entries[id]);
}
times.formatEnd = dateNow();

var ctx = new L20n.Context(null);
var locale = ctx.getLocale('en-US');
locale.addAST(ast);
ctx.requestLocales(['en-US']);

times.getEntity = dateNow();
for (var id in ids) {
  ctx.getEntity(ids[id], data);
}
times.getEntityEnd = dateNow();
*/
var results = {
  parseProp: micro(times.parseEnd - times.start),
  parseL20n: micro(times.l20nParseEnd - times.l20nParseStart),
  parseFTL: micro(times.ftlParseEnd - times.ftlParseStart),
  parseFTLEntries: micro(times.ftlEntriesParseEnd - times.ftlEntriesParseStart),
  //format: micro(times.formatEnd - times.format),
  //getEntity: micro(times.getEntityEnd - times.getEntity),
};

print(JSON.stringify(results));
