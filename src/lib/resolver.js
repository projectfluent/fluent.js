'use strict';

import { L10nError } from './errors';

var KNOWN_MACROS = ['plural'];
var MAX_PLACEABLE_LENGTH = 2500;

// Matches characters outside of the Latin-1 character set
var nonLatin1 = /[^\x01-\xFF]/;

// Unicode bidi isolation characters
var FSI = '\u2068';
var PDI = '\u2069';

function createEntry(node, lang) {
  var keys = Object.keys(node);

  // the most common scenario: a simple string with no arguments
  if (typeof node.$v === 'string' && keys.length === 2) {
    return node.$v;
  }

  var attrs;

  for (var i = 0, key; (key = keys[i]); i++) {
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


function format(ctx, args, entity) {
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
      locals, ctx, entity.lang, args, entity.value, entity.index);
  } finally {
    entity.dirty = false;
  }
  return rv;
}

function resolveIdentifier(ctx, lang, args, id) {
  if (KNOWN_MACROS.indexOf(id) > -1) {
    return [{}, ctx._getMacro(lang, id)];
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

  var entity = ctx._getEntity(lang, id);

  if (entity) {
    return format(ctx, args, entity);
  }

  throw new L10nError('Unknown reference: ' + id);
}

function subPlaceable(locals, ctx, lang, args, id) {
  var res;

  try {
    res = resolveIdentifier(ctx, lang, args, id);
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

    if (locals.contextIsNonLatin1 || value.match(nonLatin1)) {
      // When dealing with non-Latin-1 text
      // we wrap substitutions in bidi isolate characters
      // to avoid bidi issues.
      res[1] = FSI + value + PDI;
    }

    return res;
  }

  return [{}, '{{ ' + id + ' }}'];
}

function interpolate(locals, ctx, lang, args, arr) {
  return arr.reduce(function(prev, cur) {
    if (typeof cur === 'string') {
      return [prev[0], prev[1] + cur];
    } else if (cur.t === 'idOrVar'){
      var placeable = subPlaceable(locals, ctx, lang, args, cur.v);
      if (placeable[0].overlay) {
        prev[0].overlay = true;
      }
      return [prev[0], prev[1] + placeable[1]];
    }
  }, [locals, '']);
}

function resolveSelector(ctx, lang, args, expr, index) {
    var selectorName = index[0].v;
    var selector = resolveIdentifier(ctx, lang, args, selectorName)[1];

    if (typeof selector !== 'function') {
      // selector is a simple reference to an entity or args
      return selector;
    }

    var argValue = index[1] ?
      resolveIdentifier(ctx, lang, args, index[1])[1] : undefined;

    if (selector === ctx._getMacro(lang, 'plural')) {
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

function resolveValue(locals, ctx, lang, args, expr, index) {
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
    locals.contextIsNonLatin1 = expr.some(function($_) {
      return typeof($_) === 'string' && $_.match(nonLatin1);
    });
    return interpolate(locals, ctx, lang, args, expr);
  }

  // otherwise, it's a dict
  if (index) {
    // try to use the index in order to select the right dict member
    var selector = resolveSelector(ctx, lang, args, expr, index);
    if (expr.hasOwnProperty(selector)) {
      return resolveValue(locals, ctx, lang, args, expr[selector]);
    }
  }

  // if there was no index or no selector was found, try 'other'
  if ('other' in expr) {
    return resolveValue(locals, ctx, lang, args, expr.other);
  }

  // XXX Specify entity id
  throw new L10nError('Unresolvable value');
}

export default { createEntry, format };
