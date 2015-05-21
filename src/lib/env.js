'use strict';

import Context from './context';
import Resolver from './resolver';

export default function Env(id, fetch) {
  this.id = id;
  this.fetch = fetch;

  this._resMap = Object.create(null);
  this._resCache = Object.create(null);
}

Env.prototype.createContext = function(resIds) {
  var ctx = new Context(this, resIds);

  resIds.forEach(function(res) {
    if (!this._resMap[res]) {
      this._resMap[res] = new Set();
    }
    this._resMap[res].add(ctx);
  }, this);

  return ctx;
};

Env.prototype.destroyContext = function(ctx) {
  var cache = this._resCache;
  var map = this._resMap;

  ctx._resIds.forEach(function(resId) {
    if (map[resId].size === 1) {
      map[resId].clear();
      delete cache[resId];
    } else {
      map[resId].delete(ctx);
    }
  });
};

Env.prototype._getResource = function(lang, res) {
  let { code, src } = lang;
  let cache = this._resCache;

  if (!cache[res]) {
    cache[res] = Object.create(null);
    cache[res][code] = Object.create(null);
  } else if (!cache[res][code]) {
    cache[res][code] = Object.create(null);
  } else if (cache[res][code][src]) {
    return cache[res][code][src];
  }

  return cache[res][code][src] = this.fetch(src, res, code).then(
    ast => cache[res][code][src] = createEntries(lang, ast),
    err => cache[res][code][src] = err);
};

function createEntries(lang, ast) {
  var entries = Object.create(null);
  for (var i = 0, node; node = ast[i]; i++) {
    entries[node.$i] = Resolver.createEntry(node, lang);
  }
  return entries;
}
