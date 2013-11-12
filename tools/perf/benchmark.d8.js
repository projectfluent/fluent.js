load('../../dist/shell/l20n.js');
var parser = new L20n.Parser(true); 
var compiler = new L20n.Compiler();
var retr = new L20n.RetranslationManager();

compiler.setGlobals(retr.globals);

var code = read('./example.l20n');
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
times.parse = Date.now();

var env = compiler.compile(ast);
times.compile = Date.now();

var ids = [];
for (var id in env) {
  if (env[id].get) {
    ids.push(id);
  }
}

times.getStart = Date.now();
for (var i = 0, len = ids.length; i < len; i++) {
   env[ids[i]].get(data);
}
times.get = Date.now();

var results = {
  parse: micro(times.parse - times.start),
  compile: micro(times.compile - times.parse),
  get: micro(times.get - times.getStart),
};

print(JSON.stringify(results));
