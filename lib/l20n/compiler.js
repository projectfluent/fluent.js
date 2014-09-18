'use strict';

var L10nError = require('./errors').L10nError;

var KNOWN_MACROS = ['plural'];

var MAX_PLACEABLE_LENGTH = 2500;
var MAX_PLACEABLES = 100;
var rePlaceables = /\{\{\s*(.+?)\s*\}\}/g;

function Entity(id, node, lang) {
  this.id = id;
  this.lang = lang;
  // the dirty guard prevents cyclic or recursive references from other
  // Entities; see Entity.prototype.resolve
  this.dirty = false;
  if (typeof node === 'string') {
    this.value = node;
  } else {
    // it's either a hash or it has attrs, or both
    var keys = Object.keys(node);

    /* jshint -W084 */
    for (var i = 0, key; key = keys[i]; i++) {
      if (key[0] !== '_') {
        if (!this.attributes) {
          this.attributes = Object.create(null);
        }
        this.attributes[key] = new Entity(
          this.id + '.' + key, node[key], lang);
      }
    }
    this.value = node._ || null;
    this.index = node._index;
  }
}

Entity.prototype.resolve = function E_resolve(ctx, args) {
  if (this.dirty) {
    return undefined;
  }

  this.dirty = true;
  var val;
  // if resolve fails, we want the exception to bubble up and stop the whole
  // resolving process;  however, we still need to clean up the dirty flag
  try {
    val = resolveValue(ctx, this.lang, args, this.value, this.index);
  } finally {
    this.dirty = false;
  }
  return val;
};

Entity.prototype.format = function(ctx, args) {
  try {
    return this.resolve(ctx, args);
  } catch (e) {
    return undefined;
  }
};

Entity.prototype.get = function(ctx, args) {
  if (!this.attributes) {
    return this.format(ctx, args);
  }

  var entity = {
    value: this.format(ctx, args),
    attributes: Object.create(null)
  };

  for (var key in this.attributes) {
    /* jshint -W089 */
    entity.attributes[key] = this.attributes[key].format(ctx, args);
  }

  return entity;
};

function resolveIdentifier(ctx, lang, args, id) {
  if (KNOWN_MACROS.indexOf(id) > -1) {
    return ctx._getMacro(lang, id);
  }

  if (args && args.hasOwnProperty(id) &&
      (typeof args[id] === 'string' ||
       (typeof args[id] === 'number' && !isNaN(args[id])))) {
    return args[id];
  }

  // XXX: special case for Node.js where still:
  // '__proto__' in Object.create(null) => true
  if (id === '__proto__') {
    return undefined;
  }

  var entity = ctx._getEntity(lang, id);
  return entity ? entity.resolve(ctx, args) : undefined;
}

function subPlaceable(ctx, lang, args, match, id) {
  var value = resolveIdentifier(ctx, lang, args, id);

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // prevent Billion Laughs attacks
    if (value.length >= MAX_PLACEABLE_LENGTH) {
      throw new L10nError('Too many characters in placeable (' +
                          value.length + ', max allowed is ' +
                          MAX_PLACEABLE_LENGTH + ')');
    }
    return value;
  }

  return match;
}

function interpolate(ctx, lang, args, str) {
  var placeablesCount = 0;
  var value = str.replace(rePlaceables, function(match, id) {
    // prevent Quadratic Blowup attacks
    if (placeablesCount++ >= MAX_PLACEABLES) {
      throw new L10nError('Too many placeables (' + placeablesCount +
                          ', max allowed is ' + MAX_PLACEABLES + ')');
    }
    return subPlaceable(ctx, lang, args, match, id);
  });
  placeablesCount = 0;
  return value;
}

function resolveSelector(ctx, lang, args, expr, index) {
    var selector = resolveIdentifier(ctx, lang, args, index[0]);
    if (selector === undefined) {
      throw new L10nError('Unknown selector: ' + index[0]);
    }

    if (typeof selector !== 'function') {
      // selector is a simple reference to an entity or ctxdata
      return selector;
    }

    var argLength = index.length - 1;
    if (selector.length !== argLength) {
      throw new L10nError('Macro ' + index[0] + ' expects ' +
                          selector.length + ' argument(s), yet ' + argLength +
                          ' given');
    }

    var argValue = resolveIdentifier(ctx, lang, args, index[1]);

    // special cases for zero, one, two if they are defined on the hash
    if (argValue === 0 && 'zero' in expr) {
      return 'zero';
    }
    if (argValue === 1 && 'one' in expr) {
      return 'one';
    }
    if (argValue === 2 && 'two' in expr) {
      return 'two';
    }

    return selector(argValue);
}

function resolveValue(ctx, lang, args, expr, index) {
  if (typeof expr === 'string') {
    return interpolate(ctx, lang, args, expr);
  }

  if (typeof expr === 'boolean' ||
      typeof expr === 'number' ||
      !expr) {
    return expr;
  }

  // otherwise, it's a dict
  if (index) {
    // try to use the index in order to select the right dict member
    var selector = resolveSelector(ctx, lang, args, expr, index);
    if (expr.hasOwnProperty(selector)) {
      return resolveValue(ctx, lang, args, expr[selector]);
    }
  }

  // if there was no index or no selector was found, try 'other'
  if ('other' in expr) {
    return resolveValue(ctx, lang, args, expr.other);
  }

  return undefined;
}

exports.Entity = Entity;
exports.rePlaceables = rePlaceables;
