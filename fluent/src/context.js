import resolve from './resolver';
import parse from './parser';

/**
 * Message contexts are single-language stores of translations.  They are
 * responsible for parsing translation resources in the Fluent syntax and can
 * format translation units (entities) to strings.
 *
 * Always use `MessageContext.format` to retrieve translation units from
 * a context.  Translations can contain references to other entities or
 * external arguments, conditional logic in form of select expressions, traits
 * which describe their grammatical features, and can use Fluent builtins which
 * make use of the `Intl` formatters to format numbers, dates, lists and more
 * into the context's language.  See the documentation of the Fluent syntax for
 * more information.
 */
export class MessageContext {

  /**
   * Create an instance of `MessageContext`.
   *
   * The `locales` argument is used to instantiate `Intl` formatters used by
   * translations.  The `options` object can be used to configure the context.
   *
   * Examples:
   *
   *     const ctx = new MessageContext(locales);
   *
   *     const ctx = new MessageContext(locales, { useIsolating: false });
   *
   *     const ctx = new MessageContext(locales, {
   *       useIsolating: true,
   *       functions: {
   *         NODE_ENV: () => process.env.NODE_ENV
   *       }
   *     });
   *
   * Available options:
   *
   *   - `functions` - an object of additional functions available to
   *                   translations as builtins.
   *
   *   - `useIsolating` - boolean specifying whether to use Unicode isolation
   *                    marks (FSI, PDI) for bidi interpolations.
   *
   * @param   {string|Array<string>} locales - Locale or locales of the context
   * @param   {Object} [options]
   * @returns {MessageContext}
   */
  constructor(locales, { functions = {}, useIsolating = true } = {}) {
    this.locales = Array.isArray(locales) ? locales : [locales];

    this._privateMessages = new Map();
    this._publicMessages = new Map();
    this._functions = functions;
    this._useIsolating = useIsolating;
    this._intls = new WeakMap();
  }

  /*
   * Return an iterator over public `[id, message]` pairs.
   *
   * @returns {Iterator}
   */
  get messages() {
    return this._publicMessages[Symbol.iterator]();
  }

  /*
   * Check if a message is present in the context.
   *
   * @param {string} id - The identifier of the message to check.
   * @returns {bool}
   */
  hasMessage(id) {
    return this._publicMessages.has(id);
  }

  /*
   * Return the internal representation of a message.
   *
   * The internal representation should only be used as an argument to
   * `MessageContext.format`.
   *
   * @param {string} id - The identifier of the message to check.
   * @returns {Any}
   */
  getMessage(id) {
    return this._publicMessages.get(id);
  }

  /**
   * Add a translation resource to the context.
   *
   * The translation resource must use the Fluent syntax.  It will be parsed by
   * the context and each translation unit (message) will be available in the
   * context by its identifier.
   *
   *     ctx.addMessages('foo = Foo');
   *     ctx.getMessage('foo');
   *
   *     // Returns a raw representation of the 'foo' message.
   *
   * Parsed entities should be formatted with the `format` method in case they
   * contain logic (references, select expressions etc.).
   *
   * @param   {string} source - Text resource with translations.
   * @returns {Array<Error>}
   */
  addMessages(source) {
    const [entries, errors] = parse(source);
    for (const id in entries) {
      if (id.startsWith('-')) {
        // Identifiers starting with a dash (-) are considered private and
        // cannot be retrieved from MessageContext.
        this._privateMessages.set(id, entries[id]);
      } else {
        this._publicMessages.set(id, entries[id]);
      }
    }

    return errors;
  }

  /**
   * Format a message to a string or null.
   *
   * Format a raw `message` from the context into a string (or a null if it has
   * a null value).  `args` will be used to resolve references to external
   * arguments inside of the translation.
   *
   * In case of errors `format` will try to salvage as much of the translation
   * as possible and will still return a string.  For performance reasons, the
   * encountered errors are not returned but instead are appended to the
   * `errors` array passed as the third argument.
   *
   *     const errors = [];
   *     ctx.addMessages('hello = Hello, { $name }!');
   *     const hello = ctx.getMessage('hello');
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
   * @param   {Object | string}    message
   * @param   {Object | undefined} args
   * @param   {Array}              errors
   * @returns {?string}
   */
  format(message, args, errors) {
    // optimize entities which are simple strings with no attributes
    if (typeof message === 'string') {
      return message;
    }

    // optimize simple-string entities with attributes
    if (typeof message.val === 'string') {
      return message.val;
    }

    // optimize entities with null values
    if (message.val === undefined) {
      return null;
    }

    return resolve(this, args, message, errors);
  }

  _memoizeIntlObject(ctor, opts) {
    const cache = this._intls.get(ctor) || {};
    const id = JSON.stringify(opts);

    if (!cache[id]) {
      cache[id] = new ctor(this.locales, opts);
      this._intls.set(ctor, cache);
    }

    return cache[id];
  }
}
