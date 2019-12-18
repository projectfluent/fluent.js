import { resolveComplexPattern } from "./resolver.js";
import { Scope } from "./scope.js";
import { FluentResource } from "./resource.js";
import { FluentNone, FluentType } from "./types.js";
import { Message, Term, Pattern } from "./ast.js";

export type CustomFunction = (
  positional: Array<FluentType>,
  named: Record<string, FluentType>
) => FluentType;

export type CustomTransform = (text: string) => string;

export type FluentArgument = string | number | Date | FluentType;

/**
 * Message bundles are single-language stores of translation resources. They are
 * responsible for formatting message values and attributes to strings.
 */
export class FluentBundle {
  public locales: Array<string>;

  public _terms: Map<string, Term> = new Map();
  public _messages: Map<string, Message> = new Map();
  public _functions: Record<string, CustomFunction>;
  public _useIsolating: boolean;
  public _transform: CustomTransform;
  public _intls: WeakMap<object, Record<string, object>> = new WeakMap();

  /**
   * Create an instance of `FluentBundle`.
   *
   * The `locales` argument is used to instantiate `Intl` formatters used by
   * translations. The `options` object can be used to configure the bundle.
   *
   * Examples:
   *
   *     let bundle = new FluentBundle(["en-US", "en"]);
   *
   *     let bundle = new FluentBundle(locales, {useIsolating: false});
   *
   *     let bundle = new FluentBundle(locales, {
   *       useIsolating: true,
   *       functions: {
   *         NODE_ENV: () => process.env.NODE_ENV
   *       }
   *     });
   *
   * Available options:
   *
   *   - `functions` - an object of additional functions available to
   *     translations as builtins.
   *
   *   - `useIsolating` - boolean specifying whether to use Unicode isolation
   *     marks (FSI, PDI) for bidi interpolations. Default: `true`.
   *
   *   - `transform` - a function used to transform string parts of patterns.
   */
  constructor(
    locales: string | Array<string>,
    {
      functions = {},
      useIsolating = true,
      transform = (v: string): string => v
    }: {
      functions?: Record<string, CustomFunction>;
      useIsolating?: boolean;
      transform?: CustomTransform;
    } = {}
  ) {
    this.locales = Array.isArray(locales) ? locales : [locales];
    this._functions = functions;
    this._useIsolating = useIsolating;
    this._transform = transform;
  }

  /**
   * Check if a message is present in the bundle.
   *
   * @param id - The identifier of the message to check.
   */
  hasMessage(id: string): boolean {
    return this._messages.has(id);
  }

  /**
   * Return a raw unformatted message object from the bundle.
   *
   * Raw messages are `{value, attributes}` shapes containing translation units
   * called `Patterns`. `Patterns` are implementation-specific; they should be
   * treated as black boxes and formatted with `FluentBundle.formatPattern`.
   *
   * @param id - The identifier of the message to check.
   */
  getMessage(id: string): Message | undefined {
    return this._messages.get(id);
  }

  /**
   * Add a translation resource to the bundle.
   *
   * The translation resource must be an instance of `FluentResource`.
   *
   *     let res = new FluentResource("foo = Foo");
   *     bundle.addResource(res);
   *     bundle.getMessage("foo");
   *     // → {value: .., attributes: {..}}
   *
   * Available options:
   *
   *   - `allowOverrides` - boolean specifying whether it's allowed to override
   *     an existing message or term with a new value. Default: `false`.
   *
   * @param   res - FluentResource object.
   * @param   options
   */
  addResource(
    res: FluentResource,
    { allowOverrides = false }: { allowOverrides?: boolean } = {}
  ): Array<Error> {
    const errors = [];

    for (let i = 0; i < res.body.length; i++) {
      let entry = res.body[i];
      if (entry.id.startsWith("-")) {
        // Identifiers starting with a dash (-) define terms. Terms are private
        // and cannot be retrieved from FluentBundle.
        if (allowOverrides === false && this._terms.has(entry.id)) {
          errors.push(
            new Error(`Attempt to override an existing term: "${entry.id}"`)
          );
          continue;
        }
        this._terms.set(entry.id, entry as Term);
      } else {
        if (allowOverrides === false && this._messages.has(entry.id)) {
          errors.push(
            new Error(`Attempt to override an existing message: "${entry.id}"`)
          );
          continue;
        }
        this._messages.set(entry.id, entry);
      }
    }

    return errors;
  }

  /**
   * Format a `Pattern` to a string.
   *
   * Format a raw `Pattern` into a string. `args` will be used to resolve
   * references to variables passed as arguments to the translation.
   *
   * In case of errors `formatPattern` will try to salvage as much of the
   * translation as possible and will still return a string. For performance
   * reasons, the encountered errors are not returned but instead are appended
   * to the `errors` array passed as the third argument.
   *
   *     let errors = [];
   *     bundle.addResource(
   *         new FluentResource("hello = Hello, {$name}!"));
   *
   *     let hello = bundle.getMessage("hello");
   *     if (hello.value) {
   *         bundle.formatPattern(hello.value, {name: "Jane"}, errors);
   *         // Returns "Hello, Jane!" and `errors` is empty.
   *
   *         bundle.formatPattern(hello.value, undefined, errors);
   *         // Returns "Hello, {$name}!" and `errors` is now:
   *         // [<ReferenceError: Unknown variable: name>]
   *     }
   *
   * If `errors` is omitted, the first encountered error will be thrown.
   */
  formatPattern(
    pattern: Pattern,
    args: Record<string, FluentArgument> | null = null,
    errors: Array<Error> | null = null
  ): string {
    // Resolve a simple pattern without creating a scope. No error handling is
    // required; by definition simple patterns don't have placeables.
    if (typeof pattern === "string") {
      return this._transform(pattern);
    }

    // Resolve a complex pattern.
    let scope = new Scope(this, errors, args);
    try {
      let value = resolveComplexPattern(scope, pattern);
      return value.toString(scope);
    } catch (err) {
      if (scope.errors) {
        scope.errors.push(err);
        return new FluentNone().toString(scope);
      }
      throw err;
    }
  }
}
