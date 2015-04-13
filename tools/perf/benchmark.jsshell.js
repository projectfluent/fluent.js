load('../../dist/jsshell/l10n.js');

var parser = L20n.PropertiesParser;
var env = {
  __plural: L20n.getPluralRule('en-US')
};

var code = read('./example.properties');
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

var ast = parser.parse(null, code);
times.parseEnd = dateNow();

times.createEntries = dateNow();
L20n.extendEntries(env, ast);
times.createEntriesEnd = dateNow();

var ids = Object.keys(env).filter(function(id){return id !== '__plural';});

times.format = dateNow();
for (var id in ids) {
   L20n.Resolver.format(data, env[ids[id]]);
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

var results = {
  parse: micro(times.parseEnd - times.start),
  createEntries: micro(times.createEntriesEnd - times.createEntries),
  format: micro(times.formatEnd - times.format),
  getEntity: micro(times.getEntityEnd - times.getEntity),
};

print(JSON.stringify(results));
