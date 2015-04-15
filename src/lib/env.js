'use strict';

/* jshint -W079 */

var L10nError = require('./errors').L10nError;
var View = require('./view').View;
var PropertiesParser = require('./format/properties/parser');
var Resolver = require('./resolver');
var debug = require('./debug').debug;

export function Env(io, id) {
  this.io = io;
  this.id = id;

  this._resMap = Object.create(null);
  this._resCache = Object.create(null);
}

Env.prototype.createView = function(resIds) {
  var view = new View(this, resIds);

  resIds.forEach(function(res) {
    if (!this._resMap[res]) {
      this._resMap[res] = new Set();
    }
    this._resMap[res].add(view);
  }, this);

  return view;
};

Env.prototype.destroyView = function(view) {
  var cache = this._resCache;
  var map = this._resMap;

  view._resIds.forEach(function(resId) {
    if (map[resId].size === 1) {
      map[resId].clear();
      delete cache[resId];
    } else {
      map[resId].delete(view);
    }
  });
};

var bindingsIO = {
  extra: function(lang, ver, path, type) {
    if (type === 'properties') {
      type = 'text';
    }
    return ver.then(
      function(appVersion) {
        /* global navigator */
        return navigator.mozApps.getLocalizationResource(
          lang, appVersion, path, type); });
  },
  app: function(lang, ver, path, type) {
    switch (type) {
      case 'properties':
        return this.io.load(path);
      case 'json':
        return this.io.loadJSON(path);
      default:
        throw new L10nError('Unknown file type: ' + type);
    }
  },
};

function load(lang, res, type, cont) {
  var url = res.replace('{locale}', lang);

  debug('loading url', url);

  /* global navigator */
  var source = navigator.mozL10n._config.localeSources[lang] || 'app';
  var appVersion = navigator.mozL10n.meta.appVersion;

  var raw = bindingsIO[source].call(this, lang, appVersion, url, type);

  return cont ? raw.then(cont) : raw;
}

Env.prototype._getResource = function(lang, res) {
  debug('getting resource', res, 'for', lang);
  var cache = this._resCache;

  if (!cache[res]) {
    cache[res] = Object.create(null);
  } else if (cache[res][lang]) {
    debug(res, 'for', lang, 'found in cache; returning');
    return cache[res][lang];
  }

  var type = res.substr(res.lastIndexOf('.') + 1);
  var cont = type === 'properties' ?
    PropertiesParser.parse.bind(PropertiesParser, null) : undefined;

  return cache[res][lang] = load.call(this, lang, res, type, cont).then(
    function(ast) {
    debug(res, 'for', lang, 'loaded');
    return cache[res][lang] = createEntries(lang, ast);
  }, function(err) {
    debug(res, 'for', lang, 'errored with', err);
    // XXX Emit the error but don't propagate it to Promise.all in
    // Context._fetchResources so that Context.ready always fullfills.
    return cache[res][lang] = err;
  });
};

function createEntries(lang, ast) {
  var entries = Object.create(null);
  for (var i = 0, node; node = ast[i]; i++) {
    entries[node.$i] = Resolver.createEntry(node, lang);
  }
  return entries;
}
