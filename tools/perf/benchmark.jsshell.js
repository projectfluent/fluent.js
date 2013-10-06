load('../../dist/shell/l20n.js');
var parser = new L20n.Parser(true); 
var compiler = new L20n.Compiler();

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

var ast = parser.parse(code);
times.parseEnd = dateNow();

ast.body['plural'] = {
  type: 'Macro',
  args: [{
    type: 'Identifier',
    name: 'n'
  }],
  expression: L20n.getPluralRule('en-US')
};

times.compile = dateNow();
var env = compiler.compile(ast);
times.compileEnd = dateNow();

var ids = [];
for (var id in env) {
  if (env[id].get) {
    ids.push(id);
  }
}

times.get = dateNow();
for (var i = 0, len = ids.length; i < len; i++) {
   env[ids[i]].get(data);
}
times.getEnd = dateNow();

var results = {
  parse: micro(times.parseEnd - times.start),
  compile: micro(times.compileEnd - times.compile),
  get: micro(times.getEnd - times.get),
};

print(JSON.stringify(results));
