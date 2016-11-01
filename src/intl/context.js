import FTLRuntimeParser from '../ftl/entries/parser';
import resolve from './resolver';
import { FTLNone } from './types';

/**
 * Message contexts are single-language stores of translations.  They are
 * responsible for parsing translation resources in the FTL syntax and can
 * format translation units (entities) to strings.
 *
 * Always use `MessageContext.format` to retrieve translation units from
 * a context.  Translations can contain references to other entities or
 * external arguments, conditional logic in form of select expressions, traits
 * which describe their grammatical features, and can use FTL builtins which
 * make use of the `Intl` formatters to format numbers, dates, lists and more
 * into the context's language.  See the documentation of the FTL syntax for
 * more information.
 */
export class MessageContext {

  /**
   * Create an instance of `MessageContext`.
   *
   * The `lang` argument is used to instantiate `Intl` formatters used by
   * translations.  The `options` object can be used to configure the context.
   *
   * Available options:
   *
   *   - functions - an object of additional functions available to
   *                 translations as builtins.
   *
   * @param   {string} lang      - Language of the context.
   * @param   {Object} [options]
   * @returns {MessageContext}
   */
  constructor(lang, options = {}) {
    this.lang = lang;
    this.functions = options.functions || {};
    this.messages = new Map();
    this.intls = new WeakMap();
  }

  /**
   * Add a translation resource to the context.
   *
   * The translation resource must use the FTL syntax.  It will be parsed by
   * the context and each translation unit (entity) will be available in the
   * `messages` map by its identifier.
   *
   *     ctx.addMessages('foo = Foo');
   *     ctx.messages.get('foo');
   *
   *     // Returns a raw representation of the 'foo' entity.
   *
   * Parsed entities should be formatted with the `format` method in case they
   * contain logic (references, select expressions etc.).
   *
   * @param   {string} source - Text resource with translations.
   * @returns {Array<Error>}
   */
  addMessages(source) {
    const [entries, errors] = FTLRuntimeParser.parseResource(source);
    for (const id in entries) {
      this.messages.set(id, entries[id]);
    }

    return errors;
  }

  /**
   * Format an entity to a string or null.
   *
   * Format a raw `entity` from the context's `messages` map into a string (or
   * a null if it has a null value).  `args` will be used to resolve references
   * to external arguments inside of the translation.
   *
   * In case of errors `format` will try to salvage as much of the translation
   * as possible and will still return a string.  For performance reasons, the
   * encountered errors are not returned but instead are appended to the
   * `errors` array passed as the third argument.
   *
   *     const errors = [];
   *     ctx.addMessages('hello = Hello, { $name }!');
   *     const hello = ctx.messages.get('hello');
   *     ctx.format(hello, { name: 'Jane' }, errors);
   *
   *     // Returns 'Hello, Jane!' and `errors` is empty.
   *
   *     ctx.format(hello, undefined, errors);
   *
   *     // Returns 'Hello, name!' and `errors` is now:
   *
   *     [<ReferenceError: Unknown external: name>]
   *
   * @param   {Object | string}    entity
   * @param   {Object | undefined} args
   * @param   {Array}              errors
   * @returns {?string}
   */
  format(entity, args, errors) {
    // optimize entities which are simple strings with no traits
    if (typeof entity === 'string') {
      return entity;
    }

    // optimize entities whose value is a simple string, and traits
    if (typeof entity.val === 'string') {
      return entity.val;
    }

    // optimize entities with null values and no default traits
    if (entity.val === undefined && entity.def === undefined) {
      return null;
    }

    const result = resolve(this, args, entity, errors);
    return result instanceof FTLNone ? null : result;
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
