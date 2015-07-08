'use strict';

import { Context } from './context';
import PropertiesParser from './format/properties/parser';
import L20nParser from './format/l20n/entries/parser';
import { walkEntry, qps } from './pseudo';
import { emit, addEventListener, removeEventListener } from './events';

const parsers = {
  properties: PropertiesParser,
  l20n: L20nParser,
};

export class Env {
  constructor(defaultLang, fetch) {
    this.defaultLang = defaultLang;
    this.fetch = fetch;

    this._resCache = Object.create(null);

    const listeners = {};
    this.emit = emit.bind(this, listeners);
    this.addEventListener = addEventListener.bind(this, listeners);
    this.removeEventListener = removeEventListener.bind(this, listeners);
  }

  createContext(resIds) {
    return new Context(this, resIds);
  }

  _parse(syntax, lang, data) {
    const parser = parsers[syntax];
    if (!parser) {
      return data;
    }

    const emit = (type, err) => this.emit(type, amendError(lang, err));
    return parser.parse.call(parser, emit, data);
  }

  _getResource(lang, res) {
    const cache = this._resCache;
    const id = res + lang.code + lang.src;

    if (cache[id]) {
      return cache[id];
    }

    const syntax = res.substr(res.lastIndexOf('.') + 1);

    const saveEntries = data => {
      const entries = this._parse(syntax, lang, data);
      if (lang.src !== 'qps') {
        cache[id] = entries;
      } else {
        cache[id] = Object.create(null);
        for (let key in entries) {
          cache[id][key] = walkEntry(entries[key], qps[lang.code].translate);
        }
      }
    };

    const recover = err => {
      err.lang = lang;
      this.emit('fetcherror', err);
      cache[id] = err;
    };

    const langToFetch = lang.src === 'qps' ?
      { code: this.defaultLang, src: 'app' } :
      lang;

    return cache[id] = this.fetch(res, langToFetch).then(
      saveEntries, recover);
  }
}

export function amendError(lang, err) {
  err.lang = lang;
  return err;
}
