'use strict';

import { L10nError } from '../../../lib/errors';
import { Env, amendError } from '../../../lib/env';
import { createEntry } from './resolver';
import PropertiesParser from './parser';
import { walkContent } from './pseudo';
import { qps } from '../../../lib/pseudo';
import {
  emit, addEventListener, removeEventListener
} from '../../../lib/events';

// XXX babel transpiles class inheritance to code which modifies prototypes 
// which triggers warnings in Gecko;  we redefine LegacyEnv from scratch to 
// avoid warnings.
export class LegacyEnv {
  constructor(defaultLang, fetch) {
    // XXX babel doesn't allow calling the constructor as a regular function 
    // so we need to copy the whole constructor from Env
    this.defaultLang = defaultLang;
    this.fetch = fetch;

    this._resCache = Object.create(null);

    const listeners = {};
    this.emit = emit.bind(this, listeners);
    this.addEventListener = addEventListener.bind(this, listeners);
    this.removeEventListener = removeEventListener.bind(this, listeners);
  }

  createContext(resIds) {
    return Env.prototype.createContext.call(this, resIds);
  }

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

  _getResource(lang, res) {
    return Env.prototype._getResource.call(this, lang, res);
  }
}

function createPseudoEntry(node, lang) {
  return createEntry(walkContent(node, qps[lang.code].translate));
}
