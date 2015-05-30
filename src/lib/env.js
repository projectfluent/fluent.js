'use strict';

import Context from './context';
import Resolver from './resolver';
import qps from './pseudo';
import { walkContent} from './util';
import { emit, addEventListener, removeEventListener } from './events';

export default function Env(id, defaultLang, fetch) {
  this.id = id;
  this.defaultLang = defaultLang;
  this.fetch = fetch;

  this._resMap = Object.create(null);
  this._resCache = Object.create(null);

  let listeners = {};
  this.emit = emit.bind(this, listeners);
  this.addEventListener = addEventListener.bind(this, listeners);
  this.removeEventListener = removeEventListener.bind(this, listeners);
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

  let fetched = src === 'qps' ?
    this.fetch(res, { code: this.defaultLang, src: 'app' }) :
    this.fetch(res, lang);

  return cache[res][code][src] = fetched.then(
    ast => cache[res][code][src] = createEntries(lang, ast),
    err => cache[res][code][src] = err);
};

function createEntries(lang, ast) {
  let entries = Object.create(null);
  let createEntry = lang.src === 'qps' ?
    createPseudoEntry : Resolver.createEntry;

  for (var i = 0, node; node = ast[i]; i++) {
    entries[node.$i] = createEntry(node, lang);
  }

  return entries;
}

function createPseudoEntry(node, lang) {
  return Resolver.createEntry(
    walkContent(node, qps[lang.code].translate), lang);
}
