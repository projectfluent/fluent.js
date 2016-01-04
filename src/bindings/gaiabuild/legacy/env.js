import { L10nError } from '../../../lib/errors';
import { Env } from '../../../lib/env';
import { LegacyContext } from './context';
import { createEntry } from './resolver';
import PropertiesParser from './parser';
import { walkContent } from './pseudo';
import { pseudo } from '../../../lib/pseudo';

// XXX babel's inheritance code triggers JavaScript warnings about modifying 
// the prototype object so we use regular prototypal inheritance here
export function LegacyEnv(fetchResource) {
  Env.call(this, fetchResource);
  this.parsers = {
    properties: PropertiesParser
  };
}

LegacyEnv.prototype = Object.create(Env.prototype);

LegacyEnv.prototype.createContext = function(langs, resIds) {
  return new LegacyContext(this, langs, resIds);
};

LegacyEnv.prototype._create = function(lang, ast) {
  const entries = Object.create(null);
  const create = lang.src === 'pseudo' ?
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
};

function createPseudoEntry(node, lang) {
  return createEntry(walkContent(node, pseudo[lang.code].process));
}
