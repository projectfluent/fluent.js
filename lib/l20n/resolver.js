'use strict';

var L10nError = require('./errors').L10nError;

var KNOWN_MACROS = ['plural'];

var MAX_PLACEABLE_LENGTH = 2500;
var rePlaceables = /\{\{\s*(.+?)\s*\}\}/g;

function createEntry(node, lang) {
  var keys = Object.keys(node);

  // the most common scenario: a simple string with no arguments
  if (typeof node.$v === 'string' && keys.length === 2) {
    return node.$v;
  }

  var attrs;

  /* jshint -W084 */
  for (var i = 0, key; key = keys[i]; i++) {
    if (key[0] === '$') {
      continue;
    }

    if (!attrs) {
      attrs = Object.create(null);
    }
    attrs[key] = createAttribute(node[key], lang, node.$i + '.' + key);
  }

  return {
    id: node.$i,
    value: node.$v || null,
    index: node.$x || null,
    attrs: attrs || null,
    lang: lang,
    // the dirty guard prevents cyclic or recursive references
    dirty: false
  };
}

function createAttribute(node, lang, id) {
  if (typeof node === 'string') {
    return node;
  }

  var value;
  if (Array.isArray(node)) {
    value = node;
  }

  return {
    id: id,
    value: value || node.$v || null,
    index: node.$x || null,
    lang: lang,
    dirty: false
  };
}

function format(entity, ctx, args) {
  if (typeof entity === 'string') {
    return entity;
  }

  if (entity.dirty) {
    throw new L10nError('Cyclic reference to ' + entity.id);
  }

  entity.dirty = true;
  var val;
  // if format fails, we want the exception to bubble up and stop the whole
  // resolving process;  however, we still need to clean up the dirty flag
  try {
    val = resolveValue(ctx, entity.lang, args, entity.value, entity.index);
  } finally {
    entity.dirty = false;
  }
  return val;
}

function formatValue(entity, ctx, args) {
  if (typeof entity === 'string') {
    return entity;
  }

  try {
    return format(entity, ctx, args);
  } catch (e) {
    return undefined;
  }
}

function formatEntity(entity, ctx, args) {
  if (!entity.attrs) {
    return formatValue(entity, ctx, args);
  }

  var formatted = {
    value: formatValue(entity, ctx, args),
    attrs: Object.create(null)
  };

  for (var key in entity.attrs) {
    /* jshint -W089 */
    formatted.attrs[key] = formatValue(entity.attrs[key], ctx, args);
  }

  return formatted;
}

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
  return entity ? format(entity, ctx, args) : undefined;
}

function subPlaceable(ctx, lang, args, id) {
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

  return '{{ ' + id + ' }}';
}

function interpolate(ctx, lang, args, arr) {
  return arr.reduce(function(prev, cur) {
    if (typeof cur === 'string') {
      return prev + cur;
    } else if (cur.t === 'idOrVar'){
      return prev + subPlaceable(ctx, lang, args, cur.v);
    }
  }, '');
}

function resolveSelector(ctx, lang, args, expr, index) {
    var selector = resolveIdentifier(ctx, lang, args, index[0].v);
    if (selector === undefined) {
      throw new L10nError('Unknown selector: ' + index[0].v);
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
  if (typeof expr === 'string' ||
      typeof expr === 'boolean' ||
      typeof expr === 'number' ||
      !expr) {
    return expr;
  }

  if (Array.isArray(expr)) {
    return interpolate(ctx, lang, args, expr);
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

var Resolver = {
  createEntry: createEntry,
  format: format,
  formatValue: formatValue,
  formatEntity: formatEntity,
  rePlaceables: rePlaceables
};

module.exports = Resolver;
