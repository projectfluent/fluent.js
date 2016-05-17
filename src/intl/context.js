import FTLRuntimeParser from '../ftl/entries/parser';
import { format } from './resolver';

export class MessageContext {
  constructor(lang, { macros = {} }) {
    this.lang = lang;
    this.macros = macros;
    this.messages = new Map();
    this.formatters = new WeakMap();
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

  _memoizeFormatter(ctor, opts) {
    const cache = this.formatters.get(ctor) || {};
    const id = JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(this.lang, opts);
      this.formatters.set(ctor, cache);
    }

    return cache[id];
  }

}
