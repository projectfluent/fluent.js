import resolve from "./resolver.js";
import FluentResource from "./resource.js";

/**
 * Message bundles are single-language stores of translations.  They are
 * responsible for parsing translation resources in the Fluent syntax and can
 * format translation units (entities) to strings.
 *
 * Always use `FluentBundle.format` to retrieve translation units from a
 * bundle. Translations can contain references to other entities or variables,
 * conditional logic in form of select expressions, traits which describe their
 * grammatical features, and can use Fluent builtins which make use of the
 * `Intl` formatters to format numbers, dates, lists and more into the
 * bundle's language. See the documentation of the Fluent syntax for more
 * information.
 */
export default class FluentBundle {
  /**
   * Create an instance of `FluentBundle`.
   *
   * The `locales` argument is used to instantiate `Intl` formatters used by
   * translations.  The `options` object can be used to configure the bundle.
   *
   * Examples:
   *
   *     const bundle = new FluentBundle(locales);
   *
   *     const bundle = new FluentBundle(locales, { useIsolating: false });
   *
   *     const bundle = new FluentBundle(locales, {
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
   *                    Default: true
   *
   *   - `transform` - a function used to transform string parts of patterns.
   *
   * @param   {string|Array<string>} locales - Locale or locales of the bundle
   * @param   {Object} [options]
   * @returns {FluentBundle}
   */
  constructor(locales, {
    functions = {},
    useIsolating = true,
    transform = v => v,
  } = {}) {
    this.locales = Array.isArray(locales) ? locales : [locales];

    this._terms = new Map();
    this._messages = new Map();
    this._functions = functions;
    this._useIsolating = useIsolating;
    this._transform = transform;
    this._intls = new WeakMap();
  }

  /*
   * Return an iterator over public `[id, message]` pairs.
   *
   * @returns {Iterator}
   */
  get messages() {
    return this._messages[Symbol.iterator]();
  }

  /*
   * Check if a message is present in the bundle.
   *
   * @param {string} id - The identifier of the message to check.
   * @returns {bool}
   */
  hasMessage(id) {
    return this._messages.has(id);
  }

  /**
   * Add a translation resource to the bundle.
   *
   * The translation resource must use the Fluent syntax.  It will be parsed by
   * the bundle and each translation unit (message) will be available in the
   * bundle by its identifier.
   *
   *     bundle.addMessages('foo = Foo');
   *     bundle.getMessage('foo');
   *
   *     // Returns a raw representation of the 'foo' message.
   *
   *     bundle.addMessages('bar = Bar');
   *     bundle.addMessages('bar = Newbar', { allowOverrides: true });
   *     bundle.getMessage('bar');
   *
   *     // Returns a raw representation of the 'bar' message: Newbar.
   *
   * Parsed entities should be formatted with the `format` method in case they
   * contain logic (references, select expressions etc.).
   *
   * Available options:
   *
   *   - `allowOverrides` - boolean specifying whether it's allowed to override
   *                      an existing message or term with a new value.
   *                      Default: false
   *
   * @param   {string} source - Text resource with translations.
   * @param   {Object} [options]
   * @returns {Array<Error>}
   */
  addMessages(source, options) {
    const res = FluentResource.fromString(source);
    return this.addResource(res, options);
  }

  /**
   * Add a translation resource to the bundle.
   *
   * The translation resource must be an instance of FluentResource,
   * e.g. parsed by `FluentResource.fromString`.
   *
   *     let res = FluentResource.fromString("foo = Foo");
   *     bundle.addResource(res);
   *     bundle.getMessage('foo');
   *
   *     // Returns a raw representation of the 'foo' message.
   *
   *     let res = FluentResource.fromString("bar = Bar");
   *     bundle.addResource(res);
   *     res = FluentResource.fromString("bar = Newbar");
   *     bundle.addResource(res, { allowOverrides: true });
   *     bundle.getMessage('bar');
   *
   *     // Returns a raw representation of the 'bar' message: Newbar.
   *
   * Parsed entities should be formatted with the `format` method in case they
   * contain logic (references, select expressions etc.).
   *
   * Available options:
   *
   *   - `allowOverrides` - boolean specifying whether it's allowed to override
   *                      an existing message or term with a new value.
   *                      Default: false
   *
   * @param   {FluentResource} res - FluentResource object.
   * @param   {Object} [options]
   * @returns {Array<Error>}
   */
  addResource(res, {
    allowOverrides = false,
  } = {}) {
    const errors = [];

    for (const [id, value] of res) {
      if (id.startsWith("-")) {
        // Identifiers starting with a dash (-) define terms. Terms are private
        // and cannot be retrieved from FluentBundle.
        if (allowOverrides === false && this._terms.has(id)) {
          errors.push(`Attempt to override an existing term: "${id}"`);
          continue;
        }
        this._terms.set(id, value);
      } else {
        if (allowOverrides === false && this._messages.has(id)) {
          errors.push(`Attempt to override an existing message: "${id}"`);
          continue;
        }
        this._messages.set(id, value);
      }
    }

    return errors;
  }

  /**
   * Format a message to a string or null.
   *
   * Find a message or an attribute by `path` in the bundle and format it into
   * a string (or a null if it is a message and has a null value). `path` may
   * be a simple message identifier (`foo`) or a path to an attribute using
   * a dot as the separator (`foo.bar`). `args` will be used to resolve
   * references to variables passed as arguments to the translation.
   *
   * In case of errors `format` will try to salvage as much of the translation
   * as possible and will still return a string.  For performance reasons, the
   * encountered errors are not returned but instead are appended to the
   * `errors` array passed as the third argument.
   *
   *     let errors = [];
   *     bundle.addMessages('hello = Hello, {$name}!');
   *
   *     bundle.format('hello', {name: 'Jane'}, errors);
   *     // → 'Hello, Jane!' and `errors` is empty.
   *
   *     bundle.format('hello', undefined, errors);
   *     // → 'Hello, name!' and `errors` is now:
   *     // [<ReferenceError: Unknown variable: name>]
   *
   *     errors.length = 0;
   *     bundle.addMessages(`
   *     email-input =
   *         .placeholder = Your e-mail
   *     `);
   *     bundle.format('email-input.placeholder', null, errors);
   *     // → 'Your e-mail' and `errors` is empty:
   *
   * @param   {string} path
   * @param   {?Object} args
   * @param   {?Array} errors
   * @returns {?string}
   */
  format(path, args, errors) {
    let parts = path.split(".");
    let id = parts[0];
    let message = this._messages.get(id);

    if (!this._messages.has(id)) {
      errors.push(`Message not found: "${id}"`);
      return null;
    }

    // Resolve the value of the message.
    if (parts.length === 1) {
      return formatMessage(this, args, message, errors);
    }

    // Resolve an attribute of the message.
    if (parts.length === 2) {
      if (message.attrs === null) {
        errors.push(`Message has no attributes: "${id}"`);
        return null;
      }
      let attribute = message.attrs[parts[1]];
      if (attribute === undefined){
        errors.push(`No attribute called: "${parts[1]}"`);
        return null;
      }
      return formatAttribute(this, args, attribute, errors);
    }

    errors.push(`Invalid path: "${path}"`);
    return null;
  }

  /**
   * Format a message and its attributes to a {value, attributes} object.
   *
   * Find a message by `id` in the bundle and format it and its attributes into
   * a {value, attributes} object. The `value` field will be a string or
   * `null`, if the message doesn't have a value. The `attributes` field will
   * be a `Map` of attribute names to strings. `args` will be used to resolve
   * references to variables passed as arguments to the translation.
   *
   * In case of errors `compound` will try to salvage as much of the
   * translation as possible and will still return a string.  For performance
   * reasons, the encountered errors are not returned but instead are appended
   * to the `errors` array passed as the third argument.
   *
   *     let errors = [];
   *     bundle.addMessages(`
   *     hello = Hello, {$name}!
   *     email-input =
   *         .placeholder = Your e-mail
   *     `);
   *
   *     bundle.compound('hello', {name: 'Jane'}, errors);
   *     // → {value: 'Hello, Jane!', attributes: Map {}}
   *
   *     bundle.compound('email-input', {name: 'Jane'}, errors);
   *     // → {value: null, attributes: Map {placeholder ⇒ 'Your e-mail'}}
   *
   * @param   {string} id
   * @param   {?Object} args
   * @param   {?Array} errors
   * @returns {?{value: string, attributes: Map}}
   */
  compound(id, args, errors) {
    if (!this._messages.has(id)) {
      errors.push(`Message not found: "${id}"`);
      return null;
    }

    let message = this._messages.get(id);
    let shape = {
      value: formatMessage(this, args, message, errors),
      attributes: new Map()
    };

    if (message.attrs === undefined) {
      return shape;
    }

    for (let [name, attribute] of Object.entries(message.attrs)) {
      shape.attributes.set(
        name,
        formatAttribute(this, args, attribute, errors),
      );
    }

    return shape;
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

function formatMessage(bundle, args, message, errors) {
  // Optimize messages which are simple strings with no attributes.
  if (typeof message === "string") {
    return bundle._transform(message);
  }
  // Optimize messages with null values.
  if (message.value === null) {
    return null;
  }
  // Optimize simple-string messages with attributes.
  if (typeof message.value === "string") {
    return bundle._transform(message.value);
  }
  // Resolve the complex value of the message.
  return resolve(bundle, args, message, errors);
}

function formatAttribute(bundle, args, attribute, errors) {
  // Optimize attributes which are simple text.
  if (typeof attribute === "string") {
    return bundle._transform(attribute);
  }
  // Resolve the complex value of the attribute.
  return resolve(bundle, args, attribute, errors);
}
