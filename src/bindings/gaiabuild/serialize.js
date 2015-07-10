'use strict';

import { L10nError } from '../../lib/errors';

export function serializeContext(ctx, lang) {
  const cache = ctx._env._resCache;
  return ctx._resIds.reduceRight(([errorsSeq, entriesSeq], cur) => {
    const sourceRes = cache[cur + 'en-USapp'];
    const langRes = cache[cur + lang.code + lang.src];
    const [errors, entries] = serializeEntries(
      lang,
      langRes instanceof L10nError ? {} : langRes,
      sourceRes instanceof L10nError ? {} : sourceRes);
    return [errorsSeq.concat(errors), Object.assign(entriesSeq, entries)];
  }, [[], Object.create(null)]);
}

function serializeEntries(lang, langEntries, sourceEntries) {
  const errors = [];
  const entries = Object.create(null);

  for (let id in sourceEntries) {
    const sourceEntry = sourceEntries[id];
    const langEntry = langEntries[id];

    if (!langEntry) {
      errors.push(new L10nError(
        '"' + id + '"' + ' not found in ' + lang.code, id, lang));
      entries[id] = sourceEntry;
      continue;
    }

    if (!areEntityStructsEqual(sourceEntry, langEntry)) {
      errors.push(new L10nError(
        '"' + id + '"' + ' is malformed in ' + lang.code, id, lang));
      entries[id] = sourceEntry;
      continue;
    }

    entries[id] = langEntry;
  }

  return [errors, entries];
}

function resolvesToString(entity) {
  return typeof entity === 'string' ||  // a simple string
    typeof entity.value === 'string' || // a simple string, entity with attrs
    Array.isArray(entity.value) ||      // a complex string
    typeof entity.value === 'object' && // a dict with an index
      entity.index !== null;
}

function areAttrsEqual(attrs1, attrs2) {
  const keys1 = Object.keys(attrs1 || Object.create(null));
  const keys2 = Object.keys(attrs2 || Object.create(null));

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

function areEntityStructsEqual(source, translation) {
  if (resolvesToString(source) && !resolvesToString(translation)) {
    return false;
  }

  if (source.attrs || translation.attrs) {
    return areAttrsEqual(source.attrs, translation.attrs);
  }

  return true;
}
