import FTLRuntimeParser from './format/ftl/entries/parser';
import { L10nError } from './errors';
import { format } from './resolver';

export class Bundle {
  // XXX do we need to pass lang? can it parsed from the resource?
  // for now, we assume Bundles are single-language only which means that all 
  // Intl formatters will be in one language, even if the translations has been 
  // merged into the resource from another language
  // XXX in the future we can add options to the ctor and allow definining 
  // custom builtins
  constructor(lang) {
    this.lang = lang;
    this.messages = new Map();
    this._intls = new WeakMap();
  }

  addMessages(source) {
    const [entries, errors] = FTLRuntimeParser.parseResource(source);
    for (let id in entries) {
      this.messages.set(id, entries[id]);
    }

    return errors;
  }

  format(entity, args) {
    return format(this, this.lang, args, entity);
  }

  _memoizeIntlObject(ctor, lang, opts) {
    const cache = this._intls.get(ctor) || {};
    const id = lang + JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(lang, opts);
      this._intls.set(ctor, cache);
    }

    return cache[id];
  }

}
