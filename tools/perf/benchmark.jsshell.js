load('../../dist/jsshell/l10n.js');

var propertiesParser = L20n.PropertiesParser;
var l20nParser = L20n.L20nParser;
var env = {
  __plural: L20n.getPluralRule('en-US')
};

var propCode = read('./example.properties');
var l20nCode = read('./example.l20n');
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
  // time is in milliseconds with decimals
  return Math.round(time * 1000);
}

var times = {};
times.start = dateNow();

var ast = propertiesParser.parse(null, propCode);
times.parseEnd = dateNow();

times.l20nParseStart = dateNow();

var ast = l20nParser.parse(null, l20nCode);
times.l20nParseEnd = dateNow();

times.createEntries = dateNow();
L20n.extendEntries(env, ast);
times.createEntriesEnd = dateNow();

var ids = Object.keys(env).filter(function(id){return id !== '__plural';});

times.format = dateNow();
for (var id in ids) {
   L20n.Resolver.format(data, env[ids[id]]);
}
times.formatEnd = dateNow();
/*
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
  createEntries: micro(times.createEntriesEnd - times.createEntries),
  format: micro(times.formatEnd - times.format),
  //getEntity: micro(times.getEntityEnd - times.getEntity),
};

print(JSON.stringify(results));
