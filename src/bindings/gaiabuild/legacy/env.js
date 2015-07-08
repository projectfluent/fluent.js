'use strict';

import { L10nError } from '../../../lib/errors';
import { Env, amendError } from '../../../lib/env';
import { createEntry } from './resolver';
import PropertiesParser from './parser';
import { walkEntry, qps } from '../../../lib/pseudo';

export class LegacyEnv extends Env {
  _parse(syntax, lang, data) {
    const emit = (type, err) => this.emit(type, amendError(lang, err));
    return PropertiesParser.parse.call(PropertiesParser, emit, data);
  }

  _create(lang, ast) {
    const entries = Object.create(null);
    const create = lang.src === 'qps' ?
      createPseudoEntry : createEntry;

    for (let i = 0, node; node = ast[i]; i++) {
      const id = node.$i;
      if (id in entries) {
        this.emit('duplicateerror', new L10nError(
         'Duplicate string "' + id + '" found in ' + lang.code, id, lang));
      }
      entries[id] = create(node, lang);
    }

    return entries;
  }
}

function createPseudoEntry(node, lang) {
  return createEntry(walkEntry(node, qps[lang.code].translate));
}
