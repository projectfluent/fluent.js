import { Context } from './context';
import FTLEntriesParser from './format/ftl/entries/parser';

export class Env {
  constructor(fetchResource) {
    this.fetchResource = fetchResource;

    this.resCache = new Map();
    this.resRefs = new Map();
    this.builtins = null;
    this.parsers = {
      ftl: FTLEntriesParser
    };
  }

  createContext(langs, resIds) {
    const ctx = new Context(this, langs, resIds);
    resIds.forEach(resId => {
      const usedBy = this.resRefs.get(resId) || 0;
      this.resRefs.set(resId, usedBy + 1);
    });

    return ctx;
  }

  destroyContext(ctx) {
    ctx.resIds.forEach(resId => {
      const usedBy = this.resRefs.get(resId) || 0;

      if (usedBy > 1) {
        return this.resRefs.set(resId, usedBy - 1);
      }

      this.resRefs.delete(resId);
      this.resCache.forEach((val, key) =>
        key.startsWith(resId) ? this.resCache.delete(key) : null);
    });
  }

  _parse(syntax, lang, data) {
    const parser = this.parsers[syntax];
    if (!parser) {
      return [data];
    }

    return parser.parseResource(data);
  }

  _getResource(lang, res) {
    const cache = this.resCache;
    const id = res + lang.code + lang.src;

    if (cache.has(id)) {
      return cache.get(id);
    }

    const syntax = res.substr(res.lastIndexOf('.') + 1);

    const saveEntries = data => {
      const [entries] = this._parse(syntax, lang, data);
      cache.set(id, entries);
    };

    const recover = err => {
      err.lang = lang;
      cache.set(id, err);
    };

    const resource = this.fetchResource(res, lang)
      .then(saveEntries, recover);

    cache.set(id, resource);

    return resource;
  }
}
