import FTLRuntimeParser from './format/ftl/entries/parser';
import { Message } from './message';

export class Bundle {
  // XXX shouldn't need to pass lang; it should be parsed from the resource
  // resources are an array of FTL source
  constructor(resources, lang) {
    this.entries = {};
    this.intls = new WeakMap();

    const reversed = resources.reverse();
    for (let resource of reversed) {
      const [entries] = FTLRuntimeParser.parseResource(resource);
      for (let id in entries) {
        this.entries[id] = new Message(entries[id], {
          lang, bundle: this
        });
      }
    }
  }

  get(id) {
    return this.entries[id];
  }


  _memoizeIntlObject(ctor, lang, opts) {
    const cache = this.intls.get(ctor) || {};
    const id = lang + JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(lang, opts);
      this.intls.set(ctor, cache);
    }

    return cache[id];
  }

}
