import FTLRuntimeParser from '../ftl/entries/parser';
import { format } from './resolver';

export class Bundle {
  constructor(lang, opts) {
    this.lang = lang;
    this.opts = opts;
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
    return format(this, args, entity);
  }

  _memoizeIntlObject(ctor, opts) {
    const cache = this._intls.get(ctor) || {};
    const id = JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(this.lang, opts);
      this._intls.set(ctor, cache);
    }

    return cache[id];
  }

}
