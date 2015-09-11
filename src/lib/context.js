'use strict';

import { L10nError } from './errors';
import { format } from './resolver';
import { getPluralRule } from './plurals';

export class Context {
  constructor(env, resIds) {
    this._env = env;
    this._resIds = resIds;
  }

  _formatTuple(lang, args, entity, id, key) {
    try {
      return format(this, lang, args, entity);
    } catch (err) {
      err.id = key ? id + '::' + key : id;
      err.lang = lang;
      this._env.emit('resolveerror', err, this);
      return [{ error: err }, err.id];
    }
  }

  _formatEntity(lang, args, entity, id) {
    const [, value] = this._formatTuple(lang, args, entity, id);

    const formatted = {
      value,
      attrs: null,
    };

    if (entity.attrs) {
      formatted.attrs = Object.create(null);
      for (let key in entity.attrs) {
        /* jshint -W089 */
        const [, attrValue] = this._formatTuple(
          lang, args, entity.attrs[key], id, key);
        formatted.attrs[key] = attrValue;
      }
    }

    return formatted;
  }

  _formatValue(lang, args, entity, id) {
    return this._formatTuple(lang, args, entity, id)[1];
  }

  fetch(langs) {
    if (langs.length === 0) {
      return Promise.resolve(langs);
    }

    return Promise.all(
      this._resIds.map(
        this._env._getResource.bind(this._env, langs[0]))).then(
          () => langs);
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
        return formatter.call(this, lang, args, entity, id);
      }

      this._env.emit('notfounderror',
        new L10nError('"' + id + '"' + ' not found in ' + lang.code,
          id, lang), this);
      hasUnresolved = true;
    });

    if (!hasUnresolved) {
      return Promise.resolve(resolved);
    }

    return this.fetch(langs.slice(1)).then(
      nextLangs => this._resolve(nextLangs, keys, formatter, resolved));
  }

  resolveEntities(langs, keys) {
    return this._resolve(langs, keys, this._formatEntity);
  }

  resolveValues(langs, keys) {
    return this._resolve(langs, keys, this._formatValue);
  }

  _getEntity(lang, id) {
    const cache = this._env._resCache;

    // Look for `id` in every resource in order.
    for (let i = 0, resId; resId = this._resIds[i]; i++) {
      const resource = cache[resId + lang.code + lang.src];
      if (resource instanceof L10nError) {
        continue;
      }
      if (id in resource) {
        return resource[id];
      }
    }
    return undefined;
  }

  // XXX in the future macros will be stored in localization resources together 
  // with regular entities and this method will not be needed anymore
  _getMacro(lang, id) {
    switch(id) {
      case 'plural':
        return getPluralRule(lang.code);
      default:
        return undefined;
    }
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

  this._env.emit('notfounderror', new L10nError(
    '"' + [...missingIds].join(', ') + '"' +
    ' not found in any language', missingIds), this);

  return resolved;
}
