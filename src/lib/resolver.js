'use strict';

import { L10nError } from './errors';

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
    // skip $i (id), $v (value), $x (index)
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
    value: node.$v !== undefined ? node.$v : null,
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

  return {
    id: id,
    value: node.$v || (node !== undefined ? node : null),
    index: node.$x || null,
    lang: lang,
    dirty: false
  };
}


function format(view, args, entity) {
  var locals = {
    overlay: false
  };

  if (typeof entity === 'string') {
    return [locals, entity];
  }

  if (entity.dirty) {
    throw new L10nError('Cyclic reference detected: ' + entity.id);
  }

  entity.dirty = true;

  var rv;

  // if format fails, we want the exception to bubble up and stop the whole
  // resolving process;  however, we still need to clean up the dirty flag
  try {
    rv = resolveValue(
      locals, view, entity.lang, args, entity.value, entity.index);
  } finally {
    entity.dirty = false;
  }
  return rv;
}

function resolveIdentifier(view, lang, args, id) {
  if (KNOWN_MACROS.indexOf(id) > -1) {
    return [{}, view._getMacro(lang, id)];
  }

  if (args && args.hasOwnProperty(id)) {
    if (typeof args[id] === 'string' || (typeof args[id] === 'number' &&
        !isNaN(args[id]))) {
      return [{}, args[id]];
    } else {
      throw new L10nError('Arg must be a string or a number: ' + id);
    }
  }

  // XXX: special case for Node.js where still:
  // '__proto__' in Object.create(null) => true
  if (id === '__proto__') {
    throw new L10nError('Illegal id: ' + id);
  }

  var entity = view._getEntity(lang, id);

  if (entity) {
    return format(view, args, entity);
  }

  throw new L10nError('Unknown reference: ' + id);
}

function subPlaceable(view, lang, args, id) {
  var res;

  try {
    res = resolveIdentifier(view, lang, args, id);
  } catch (err) {
    return [{ error: err }, '{{ ' + id + ' }}'];
  }

  var value = res[1];

  if (typeof value === 'number') {
    return res;
  }

  if (typeof value === 'string') {
    // prevent Billion Laughs attacks
    if (value.length >= MAX_PLACEABLE_LENGTH) {
      throw new L10nError('Too many characters in placeable (' +
                          value.length + ', max allowed is ' +
                          MAX_PLACEABLE_LENGTH + ')');
    }
    return res;
  }

  return [{}, '{{ ' + id + ' }}'];
}

function interpolate(locals, view, lang, args, arr) {
  return arr.reduce(function(prev, cur) {
    if (typeof cur === 'string') {
      return [prev[0], prev[1] + cur];
    } else if (cur.t === 'idOrVar'){
      var placeable = subPlaceable(view, lang, args, cur.v);
      if (placeable[0].overlay) {
        prev[0].overlay = true;
      }
      return [prev[0], prev[1] + placeable[1]];
    }
  }, [locals, '']);
}

function resolveSelector(view, lang, args, expr, index) {
    var selectorName = index[0].v;
    var selector = resolveIdentifier(view, lang, args, selectorName)[1];

    if (typeof selector !== 'function') {
      // selector is a simple reference to an entity or args
      return selector;
    }

    var argValue = index[1] ?
      resolveIdentifier(view, lang, args, index[1])[1] : undefined;

    if (selector === view._getMacro(lang, 'plural')) {
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
    }

    return selector(argValue);
}

function resolveValue(locals, view, lang, args, expr, index) {
  if (!expr) {
    return [locals, expr];
  }

  if (expr.$o) {
    expr = expr.$o;
    locals.overlay = true;
  }

  if (typeof expr === 'string' ||
      typeof expr === 'boolean' ||
      typeof expr === 'number') {
    return [locals, expr];
  }

  if (Array.isArray(expr)) {
    return interpolate(locals, view, lang, args, expr);
  }

  // otherwise, it's a dict
  if (index) {
    // try to use the index in order to select the right dict member
    var selector = resolveSelector(view, lang, args, expr, index);
    if (expr.hasOwnProperty(selector)) {
      return resolveValue(locals, view, lang, args, expr[selector]);
    }
  }

  // if there was no index or no selector was found, try 'other'
  if ('other' in expr) {
    return resolveValue(locals, view, lang, args, expr.other);
  }

  // XXX Specify entity id
  throw new L10nError('Unresolvable value');
}

export default { createEntry, format, rePlaceables };
