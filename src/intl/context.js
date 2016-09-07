import FTLRuntimeParser from '../ftl/entries/parser';
import { format } from './resolver';
import { FTLNone } from './types';

const optsPrimitive = { allowNoDefault: true };

export class MessageContext {
  constructor(lang, { functions } = {}) {
    this.lang = lang;
    this.functions = functions || {}
    this.messages = new Map();
    this.intls = new WeakMap();
  }

  addMessages(source) {
    const [entries, errors] = FTLRuntimeParser.parseResource(source);
    for (let id in entries) {
      this.messages.set(id, entries[id]);
    }

    return errors;
  }

  // format `entity` to a string or null
  formatToPrimitive(entity, args, errors) {
    // optimize entities which are simple strings by skipping resultion
    if (typeof entity === 'string') {
      return entity;
    }

    if (!entity) {
      return null;
    }

    // optimize entities with null values and no default traits
    if (entity.val === null) {
      return null;
    }

    const result = format(this, args, entity, errors, optsPrimitive);
    return result instanceof FTLNone ? null : result;
  }

  // format `entity` to a string
  format(entity, args, errors) {
    // optimize entities which are simple strings by skipping resultion
    if (typeof entity === 'string') {
      return entity;
    }

    if (!entity) {
      return (new FTLNone).toString();
    }

    // optimize entities with null values and no default traits
    if (entity.val === null) {
      return (new FTLNone).toString();
    }

    return format(this, args, entity, errors).toString();
  }

  _memoizeIntlObject(ctor, opts) {
    const cache = this.intls.get(ctor) || {};
    const id = JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(this.lang, opts);
      this.intls.set(ctor, cache);
    }

    return cache[id];
  }
}
