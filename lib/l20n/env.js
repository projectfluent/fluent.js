'use strict';

/* jshint -W079 */
var Set = require('es6-set');

var L10nError = require('./errors').L10nError;
var View = require('./view').View;
var io = require('./platform/io3');
var PropertiesParser = require('./format/properties/parser');
var Resolver = require('./resolver3');
var debug = require('./debug').debug;

function Env(id) {
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

Env.prototype._getResource = function(lang, res) {
  debug('getting resource', res, 'for', lang);
  var cache = this._resCache;

  if (!cache[res]) {
    cache[res] = Object.create(null);
  } else if (cache[res][lang]) {
    debug(res, 'for', lang, 'found in cache; returning');
    return cache[res][lang];
  }

  var url = res.replace('{locale}', lang);
  var type = url.substr(url.lastIndexOf('.') + 1);

  debug('loading url', url);
  switch (type) {
    case 'properties':
      return cache[res][lang] = io.load(url).then(function(source) {
        debug(url, 'loaded');
        var ast = PropertiesParser.parse(null, source);
        return cache[res][lang] = createEntries(lang, ast);
      }, function(err) {
        debug(url, 'errored with', err);
        // Handle the error but don't propagate it to Promise.all in
        // Context._fetchResources so that Context.ready always fullfills.
        // this._emitter.emit('error', err);
        return cache[res][lang] = err;
      }.bind(this));
    case 'json':
      return cache[res][lang] = io.loadJSON(url).then(function(ast) {
        debug(url, 'loaded');
        return cache[res][lang] = createEntries(lang, ast);
      }, function(err) {
        debug(url, 'errored with', err);
        return cache[res][lang] = err;
      });
    default:
      var err = new L10nError('Unknown file type: ' + type);
      debug(url, 'errored with', err);
      return cache[res][lang] = err;
  }
};

function createEntries(lang, ast) {
  var entries = Object.create(null);
  for (var i = 0, node; node = ast[i]; i++) {
    entries[node.$i] = Resolver.createEntry(node, lang);
  }
  return entries;
}

exports.Env = Env;
