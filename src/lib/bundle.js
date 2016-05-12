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
    this._lang = lang;
    this._entries = new Map();
    this._intls = new WeakMap();
  }

  addMessages(source) {
    const [entries, errors] = FTLRuntimeParser.parseResource(source);
    for (let id in entries) {
      this._entries.set(id, entries[id]);
    }

    return errors;
  }

  *[Symbol.iterator]() {
    yield* this._entries.entries();
  }

  get(id) {
    return this._entries.get(id);
  }

  has(id) {
    return this._entries.has(id);
  }

  formatValue(id, args) {
    const entity = this.get(id);

    if (!entity)  {
      return [id, [new L10nError(`Unknown entity: ${id}`)]];
    }

    return format(this, this._lang, args, entity);
  }


  // XXX move this to Context?
  formatEntity(id, args) {
    const entity = this.get(id);

    if (!entity)  {
      return [
        { value: id, attrs: null }, 
        [new L10nError(`Unknown entity: ${id}`)]
      ];
    }

    const [value] = format(this, this._lang, args, entity);

    const formatted = {
      value,
      attrs: null,
    };

    if (entity.traits) {
      formatted.attrs = Object.create(null);
      for (let trait of entity.traits) {
        const [attrValue] = format(this, this._lang, args, trait);
        formatted.attrs[trait.key.name] = attrValue;
      }
    }

    // XXX return errors
    return [formatted, []];
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
