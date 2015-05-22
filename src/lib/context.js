'use strict';

import { L10nError } from './errors';
import Resolver from './resolver';
import getPluralRule from './plurals';

export default function Context(env, resIds) {
  this._env = env;
  this._resIds = resIds;
}

Context.prototype.fetch = function(langs) {
  // XXX add arg: count of langs to fetch
  return Promise.resolve(langs).then(
    this._fetchResources.bind(this));
};

Context.prototype._formatTuple = function(args, entity) {
  try {
    return Resolver.format(this, args, entity);
  } catch (err) {
    return [{ error: err }, entity.id];
  }
};

Context.prototype._formatValue = function(args, entity) {
  if (typeof entity === 'string') {
    return entity;
  }

  // take the string value only
  return this._formatTuple.call(this, args, entity)[1];
};

Context.prototype.formatValue = function(langs, id, args) {
  return this.fetch(langs).then(
    this._fallback.bind(this, Context.prototype._formatValue, id, args));
};

Context.prototype._formatEntity = function(args, entity) {
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
};

Context.prototype.formatEntity = function(langs, id, args) {
  return this.fetch(langs).then(
    this._fallback.bind(this, Context.prototype._formatEntity, id, args));
};

Context.prototype.destroy = function() {
  this._env.destroyContext(this);
};

Context.prototype._fetchResources = function(langs) {
  if (langs.length === 0) {
    return Promise.reject(
      new L10nError('No more supported languages to try'));
  }

  return Promise.all(
    this._resIds.map(
      this._env._getResource.bind(this._env, langs[0]))).then(
        () => langs);
};

Context.prototype._fallback = function(method, id, args, langs) {
  let lang = langs[0];

  let entity = this._getEntity(lang, id);

  if (entity) {
    try {
      return method.call(this, args, entity);
    } catch (e) {
      console.error(id, ' in ', lang.code, ' is broken: ', e);
    }
  } else {
    console.error(id, ' missing from ', lang.code);
  }

  return this._fetchResources(langs.slice(1)).then(
    this._fallback.bind(this, method, id, args),
    err => { console.error(err); return id; });
};

Context.prototype._getEntity = function(lang, id) {
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
};

// XXX in the future macros will be stored in localization resources together 
// with regular entities and this method will not be needed anymore
Context.prototype._getMacro = function(lang, id) {
  switch(id) {
    case 'plural':
      return getPluralRule(lang.code);
    default:
      return undefined;
  }
};