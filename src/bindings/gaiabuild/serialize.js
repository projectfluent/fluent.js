'use strict';

import { L10nError } from '../../lib/errors';

export function serializeContext(ctx, lang) {
  let cache = ctx._env._resCache;
  return ctx._resIds.reduce(([errorsSeq, entriesSeq], cur) => {
    let sourceRes = cache[cur + 'en-USapp'];
    let langRes = cache[cur + lang.code + lang.src];
    let [errors, entries] = serializeEntries(
      lang, langRes instanceof L10nError ? {} : langRes, sourceRes);
    return [errorsSeq.concat(errors), entriesSeq.concat(entries)];
  }, [[], []]);
}

function serializeEntries(lang, langEntries, sourceEntries) {
  let errors = [];
  let entries = Object.keys(sourceEntries).map(id => {
    let sourceEntry = sourceEntries[id];
    let langEntry = langEntries[id];

    if (!langEntry) {
      errors.push(new L10nError(
        '"' + id + '"' + ' not found in ' + lang.code + '.', id, lang));
      return serializeEntry(sourceEntry, id);
    }

    if (!areEntityStructsEqual(sourceEntry, langEntry)) {
      errors.push(new L10nError(
        '"' + id + '"' + ' is malformed in ' + lang.code + '.', id, lang));
      return serializeEntry(sourceEntry, id);
    }

    return serializeEntry(langEntry, id);
  });

  return [errors, entries];
}

function serializeEntry(entry, id) {
  if (typeof entry === 'string') {
    return { $i: id, $v: entry };
  }

  let node = {
    $i: entry.id,
  };

  if (entry.value !== null) {
    node.$v = entry.value;
  }

  if (entry.index !== null) {
    node.$x = entry.index;
  }

  for (let key in entry.attrs) {
    node[key] = serializeAttribute(entry.attrs[key]);
  }

  return node;
}

function serializeAttribute(attr) {
  if (typeof attr === 'string') {
    return attr;
  }

  let node = {};

  if (attr.value !== null) {
    node.$v = attr.value;
  }

  if (attr.index !== null) {
    node.$x = attr.index;
  }

  return node;
}

function resolvesToString(entity) {
  return typeof entity === 'string' || // a simple string
    Array.isArray(entity.value) ||     // a complex string
    entity.index !== null;             // a dict with an index
}

function areEntityStructsEqual(entity1, entity2) {
  if (resolvesToString(entity1) && resolvesToString(entity2)) {
    return true;
  }

  const keys1 = Object.keys(entity1);
  const keys2 = Object.keys(entity2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let i = 0; i < keys1.length; i++) {
    if (keys2.indexOf(keys1[i]) === -1) {
      return false;
    }
  }

  return true;
}
