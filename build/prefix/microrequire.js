(function(window, undefined) {

function define(name, payload) {
  define.modules[name] = payload;
};

// un-instantiated modules
define.modules = {};
// instantiated modules
define.exports = {};

function normalize(path) {
  var parts = path.split('/');
  var normalized = [];
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] == '.') {
      // don't add it to `normalized`
    } else if (parts[i] == '..') {
      normalized.pop();
    } else {
      normalized.push(parts[i]);
    }
  }
  return normalized.join('/');
}

function join(a, b) {
  return a ? a.trim().replace(/\/*$/, '/') + b.trim() : b.trim();
}

function dirname(path) {
  return path ? path.split('/').slice(0, -1).join('/') : null;
}

function req(leaf, name) {
  name = normalize(join(dirname(leaf), name));
  if (name in define.exports) {
    return define.exports[name];
  }
  if (!(name in define.modules)) {
    throw new Error("Module not defined: " + name);
  }

  var module = define.modules[name];
  if (typeof module == "function") {
    var exports = {};
    var reply = module(req.bind(null, name), exports, { id: name, uri: "" });
    module = (reply !== undefined) ? reply : exports;
  }
  return define.exports[name] = module;
};

// for the top-level required modules, leaf is null
var require = req.bind(null, null);
