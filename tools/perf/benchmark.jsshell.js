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
var ast = L20n.FTLASTParser.parseResource(ftlCode);
times.ftlParseEnd = dateNow();

var entries = L20n.createEntriesFromAST(ast);
var ctx = new L20n.MockContext();

times.format = dateNow();
for (var id in entries) {
  L20n.format(ctx, lang, data, entries[id]);
}
times.formatEnd = dateNow();

var results = {
  parseProp: micro(times.parseEnd - times.start),
  parseL20n: micro(times.l20nParseEnd - times.l20nParseStart),
  parseFTL: micro(times.ftlParseEnd - times.ftlParseStart),
  //format: micro(times.formatEnd - times.format),
  //getEntity: micro(times.getEntityEnd - times.getEntity),
};

print(JSON.stringify(results));
