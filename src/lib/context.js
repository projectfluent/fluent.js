import { L10nError } from './errors';
import { format } from './resolver';

const IntlObjects = new WeakMap();

export class Context {
  constructor(env, langs, resIds) {
    this.langs = langs;
    this.resIds = resIds;
    this.env = env;
  }

  _formatEntity(lang, args, entity) {
    const [value] = format(this, lang, args, entity);

    const formatted = {
      value,
      attrs: null,
    };

    if (entity.traits) {
      formatted.attrs = Object.create(null);
      for (let trait of entity.traits) {
        const [attrValue] = format(this, lang, args, trait);
        formatted.attrs[trait.key.name] = attrValue;
      }
    }

    return formatted;
  }

  _formatValue(lang, args, entity) {
    const [value] = format(this, lang, args, entity);
    return value;
  }

  fetch(langs = this.langs) {
    if (langs.length === 0) {
      return Promise.resolve(langs);
    }

    return Promise.all(
      this.resIds.map(
        resId => this.env._getResource(langs[0], resId))
    ).then(() => langs);
  }

  _resolve(langs, keys, formatter, prevResolved) {
    const lang = langs[0];

    if (!lang) {
      return reportMissing.call(this, keys, formatter, prevResolved);
    }

    let hasUnresolved = false;

    const resolved = keys.map((key, i) => {
      if (prevResolved && prevResolved[i] !== undefined) {
        return prevResolved[i];
      }
      const [id, args] = Array.isArray(key) ?
        key : [key, undefined];
      const entity = this._getEntity(lang, id);

      if (entity) {
        return formatter.call(this, lang, args, entity);
      }

      hasUnresolved = true;
    });

    if (!hasUnresolved) {
      return resolved;
    }

    return this.fetch(langs.slice(1)).then(
      nextLangs => this._resolve(nextLangs, keys, formatter, resolved));
  }

  formatEntities(...keys) {
    return this.fetch().then(
      langs => this._resolve(langs, keys, this._formatEntity));
  }

  formatValues(...keys) {
    return this.fetch().then(
      langs => this._resolve(langs, keys, this._formatValue));
  }

  _getEntity(lang, name) {
    const cache = this.env.resCache;

    // Look for `name` in every resource in order.
    for (let i = 0, resId; resId = this.resIds[i]; i++) {
      const resource = cache.get(resId + lang.code + lang.src);
      if (resource instanceof L10nError) {
        continue;
      }
      if (name in resource) {
        return resource[name];
      }
    }
    return undefined;
  }

  _memoizeIntlObject(ctor, {code}, opts) {
    const cache = IntlObjects.get(ctor) || {};
    const id = code + JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(code, opts);
      IntlObjects.set(ctor, cache);
    }

    return cache[id];
  }

}

function reportMissing(keys, formatter, resolved) {
  const missingIds = new Set();

  keys.forEach((key, i) => {
    if (resolved && resolved[i] !== undefined) {
      return;
    }
    const id = Array.isArray(key) ? key[0] : key;
    missingIds.add(id);
    resolved[i] = formatter === this._formatValue ?
      id : {value: id, attrs: null};
  });

  return resolved;
}
