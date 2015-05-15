'use strict';

import { L10nError } from './errors';
import Resolver from './resolver';
import getPluralRule from './plurals';
import debug from './debug';

export default function View(env, resIds) {
  this._env = env;
  this._resIds = resIds;
}

View.prototype.fetch = function(langs) {
  // XXX add arg: count of langs to fetch
  return Promise.resolve(langs).then(
    this._fetchResources.bind(this));
};

View.prototype._formatTuple = function(args, entity) {
  try {
    return Resolver.format(this, args, entity);
  } catch (err) {
    return [{ error: err }, entity.id];
  }
};

View.prototype._formatValue = function(args, entity) {
  if (typeof entity === 'string') {
    return entity;
  }

  // take the string value only
  return this._formatTuple.call(this, args, entity)[1];
};

View.prototype._formatEntity = function(args, entity) {
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

View.prototype.formatEntity = function(langs, id, args) {
  return this.fetch(langs).then(
    this._fallback.bind(this, '_formatEntity', id, args));
};

View.prototype.destroy = function() {
  this._env.destroyView(this);
};

View.prototype._fetchResources = function({langs, srcs}) {
  debug('fetching resources for', langs.join(', '));

  if (langs.length === 0) {
    return Promise.reject(
      new L10nError('No more supported languages to try'));
  }

  return Promise.all(
    this._resIds.map(
      this._env._getResource.bind(this._env, langs[0], srcs[0]))).then(
        () => ({langs, srcs}));
};

View.prototype._fallback = function(method, id, args, {langs, srcs}) {
  let lang = langs[0];
  let src = srcs[0];

  let entity = this._getEntity({lang, src}, id);

  if (entity) {
    debug(id, 'found in', lang);
    try {
      return this[method](args, entity);
    } catch (e) {
      debug(id, 'in', lang, 'is broken:', e);
    }
  } else {
    debug(id, 'missing from', lang);
  }

  let tail = {langs: langs.slice(1), srcs: srcs.slice(1)};
  return this._fetchResources(tail).then(
    this._fallback.bind(this, method, id, args),
    function(err) {
      debug(err);
      return id;
    });
};

View.prototype._getEntity = function({lang, src}, id) {
  var cache = this._env._resCache;

  // Look for `id` in every resource in order.
  for (var i = 0, resId; resId = this._resIds[i]; i++) {
    var resource = cache[resId][lang][src];
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
View.prototype._getMacro = function({lang, src}, id) {
  switch(id) {
    case 'plural':
      return getPluralRule(lang);
    default:
      return undefined;
  }
};
