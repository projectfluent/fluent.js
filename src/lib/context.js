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
    const [, value] = this._formatTuple.call(this, lang, args, entity, id);

    const formatted = {
      value,
      attrs: null,
    };

    if (entity.attrs) {
      formatted.attrs = Object.create(null);
      for (let key in entity.attrs) {
        /* jshint -W089 */
        const [, attrValue] = this._formatTuple.call(
          this, lang, args, entity.attrs[key], id, key);
        formatted.attrs[key] = attrValue;
      }
    }

    return formatted;
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

  resolve(langs, id, args) {
    const lang = langs[0];

    if (!lang) {
      this._env.emit('notfounderror', new L10nError(
        '"' + id + '"' + ' not found in any language', id), this);
      return { value: id, attrs: null };
    }

    const entity = this._getEntity(lang, id);

    if (entity) {
      return Promise.resolve(
        this._formatEntity(lang, args, entity, id));
    } else {
      this._env.emit('notfounderror', new L10nError(
        '"' + id + '"' + ' not found in ' + lang.code, id, lang), this);
    }

    return this.fetch(langs.slice(1)).then(
      langs => this.resolve(langs, id, args));
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
