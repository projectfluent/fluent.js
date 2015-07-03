'use strict';

import { L10nError } from './errors';
import { Context } from './context';
import { createEntry } from './resolver';
import PropertiesParser from './format/properties/parser';
import L20nParser from './format/l20n/parser';
import { walkContent, qps } from './pseudo';
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
      const ast = this._parse(syntax, lang, data);
      cache[id] = createEntries.call(this, lang, ast);
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

function createEntries(lang, ast) {
  const entries = Object.create(null);
  const create = lang.src === 'qps' ?
    createPseudoEntry : createEntry;

  for (let i = 0, node; node = ast[i]; i++) {
    const id = node.$i;
    if (id in entries) {
      this.emit('duplicateerror', new L10nError(
       'Duplicate string "' + id + '" found in ' + lang.code, id, lang));
    }
    entries[id] = create(node, lang);
  }

  return entries;
}

function createPseudoEntry(node, lang) {
  return createEntry(
    walkContent(node, qps[lang.code].translate), lang);
}

function amendError(lang, err) {
  err.lang = lang;
  return err;
}
