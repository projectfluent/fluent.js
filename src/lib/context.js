'use strict';

import { L10nError } from './errors';
import { format } from './resolver';
import getPluralRule from './plurals';

export default class Context {
  constructor(env, resIds) {
    this._env = env;
    this._resIds = resIds;
  }

  fetch(langs) {
    // XXX add arg: count of langs to fetch
    return Promise.resolve(langs).then(
      this._fetchResources.bind(this));
  }

  formatValue(langs, id, args) {
    return this.fetch(langs).then(
      this._fallback.bind(this, Context.prototype._formatValue, id, args));
  }

  formatEntity(langs, id, args) {
    return this.fetch(langs).then(
      this._fallback.bind(this, Context.prototype._formatEntity, id, args));
  }

  destroy() {
    this._env.destroyContext(this);
  }

  /* private */

  _formatTuple(args, entity) {
    try {
      return format(this, args, entity);
    } catch (err) {
      this._env.emit('resolveerror', err, this);
      return [{ error: err }, entity.id];
    }
  }

  _formatValue(args, entity) {
    if (typeof entity === 'string') {
      return entity;
    }

    // take the string value only
    return this._formatTuple.call(this, args, entity)[1];
  }

  _formatEntity(args, entity) {
    var [locals, value] = this._formatTuple.call(this, args, entity);

    var formatted = {
      value,
      attrs: null,
      overlay: locals.overlay
    };

    if (entity.attrs) {
      formatted.attrs = Object.create(null);
    }

    for (var key in entity.attrs) {
      /* jshint -W089 */
      var [attrLocals, attrValue] = this._formatTuple.call(
        this, args, entity.attrs[key]);
      formatted.attrs[key] = attrValue;
      if (attrLocals.overlay) {
        formatted.overlay = true;
      }
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
      return method.call(this, args, entity);
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
      var resource = cache[resId][lang.code][lang.src];
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
