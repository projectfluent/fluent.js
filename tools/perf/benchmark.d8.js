load('../../dist/shell/l20n.js');
var parser = new L20n.Parser(true); 
var compiler = new L20n.Compiler();

var code = read('./example.properties');
var data = {
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
times.start = Date.now();

var ast = parser.parse(code);
times.parseEnd = Date.now();

ast.body['plural'] = {
  type: 'Macro',
  args: [{
    type: 'Identifier',
    name: 'n'
  }],
  expression: L20n.getPluralRule('en-US')
};

times.compile = Date.now();
var env = compiler.compile(ast);
times.compileEnd = Date.now();

var ids = [];
for (var id in env) {
  if (env[id].get) {
    ids.push(id);
  }
}

times.get = Date.now();
for (var i = 0, len = ids.length; i < len; i++) {
   env[ids[i]].get(data);
}
times.getEnd = Date.now();

var results = {
  parse: micro(times.parseEnd - times.start),
  compile: micro(times.compileEnd - times.compile),
  get: micro(times.getEnd - times.get),
};

print(JSON.stringify(results));
