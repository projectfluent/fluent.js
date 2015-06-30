'use strict';

import { L10nError } from './errors';
import { format } from './resolver';
import { getPluralRule } from './plurals';

export class Context {
  constructor(env, resIds) {
    this._env = env;
    this._resIds = resIds;
  }

  fetch(langs) {
    // XXX add arg: count of langs to fetch
    return this._fetchResources(langs);
  }

  formatValue(langs, id, args) {
    return this.fetch(langs).then(
      this._fallback.bind(this, Context.prototype._formatValue, id, args));
  }

  formatEntity(langs, id, args) {
    return this.fetch(langs).then(
      this._fallback.bind(this, Context.prototype._formatEntity, id, args));
  }

  /* private */

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

  _formatValue(lang, args, entity, id) {
    if (typeof entity === 'string') {
      return entity;
    }

    const [, value] = this._formatTuple.call(this, lang, args, entity, id);
    return value;
  }

  _formatEntity(lang, args, entity, id) {
    const [, value] = this._formatTuple.call(this, lang, args, entity, id);

    const formatted = {
      value,
      attrs: null,
    };

    if (entity.attrs) {
      formatted.attrs = Object.create(null);
    }

    for (let key in entity.attrs) {
      /* jshint -W089 */
      let [, attrValue] = this._formatTuple.call(
        this, lang, args, entity.attrs[key], id, key);
      formatted.attrs[key] = attrValue;
    }

    return formatted;
  }

  _fetchResources(langs) {
    if (langs.length === 0) {
      return Promise.resolve(langs);
    }

    return Promise.all(
      this._resIds.map(
        this._env._getResource.bind(this._env, langs[0]))).then(
          () => langs);
  }

  _fallback(method, id, args, langs) {
    let lang = langs[0];

    if (!lang) {
      let err = new L10nError(
        '"' + id + '"' + ' not found in any language.', id);
      this._env.emit('notfounderror', err, this);
      return id;
    }

    let entity = this._getEntity(lang, id);

    if (entity) {
      return method.call(this, lang, args, entity, id);
    } else {
      let err = new L10nError(
        '"' + id + '"' + ' not found in ' + lang.code + '.', id, lang.code);
      this._env.emit('notfounderror', err, this);
    }

    return this._fetchResources(langs.slice(1)).then(
      this._fallback.bind(this, method, id, args));
  }

  _getEntity(lang, id) {
    var cache = this._env._resCache;

    // Look for `id` in every resource in order.
    for (var i = 0, resId; resId = this._resIds[i]; i++) {
      var resource = cache[resId + lang.code + lang.src];
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
