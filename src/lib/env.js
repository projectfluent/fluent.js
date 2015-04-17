'use strict';

/* jshint -W079 */

import View from './view';
import Resolver from './resolver';
import PropertiesParser from './format/properties/parser';
import debug from './debug';

export default function Env(fetch, id) {
  this.fetch = fetch;
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

const parsers = {
  properties: PropertiesParser.parse.bind(PropertiesParser, null),
  json: null
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

  return cache[res][lang] = this.fetch(res, lang, parsers).then(
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
