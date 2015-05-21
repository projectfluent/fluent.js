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

Env.prototype._getResource = function(lang, src, res) {
  var cache = this._resCache;

  if (!cache[res]) {
    cache[res] = Object.create(null);
    cache[res][lang] = Object.create(null);
  } else if (!cache[res][lang]) {
    cache[res][lang] = Object.create(null);
  } else if (cache[res][lang][src]) {
    return cache[res][lang][src];
  }

  return cache[res][lang][src] = this.fetch(src, res, lang).then(
    ast => cache[res][lang][src] = createEntries(lang, src, ast),
    err => cache[res][lang][src] = err);
};

function createEntries(lang, src, ast) {
  var entries = Object.create(null);
  for (var i = 0, node; node = ast[i]; i++) {
    entries[node.$i] = Resolver.createEntry(node, lang, src);
  }
  return entries;
}
