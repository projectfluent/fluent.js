# Changelog

## @fluent/bundle 0.14.0 (July 30, 2019)

### `FluentBundle` API

  - Remove `FluentBundle.addMessages`.

    Use `FluentBundle.addResource` instead, combined with a `FluentResource`
    instance.

  - Remove `FluentBundle.messages`.

    The list of messages in the bundle should not be inspected. If you need
    to do it, please use the tooling parser from `@fluent/syntax`.

  - Change the shape returned by `FluentBundle.getMessage`.

    The method now returns the following shape:

        {value: Pattern | null, attributes: Record<string, Pattern>}

  - The internal representtion of `Pattern` is private.

    Raw messages returned from `getMessage` have their values and attributes
    stored in a `Pattern` type. The internal representation of this type is
    private and implementation-specific. It should not be inspected nor used
    for any purposes. The implementation may change without a warning in
    future releases. `Patterns` are black boxes and are meant to be used as
    arguments to `formatPattern`.

  - Rename `FluentBundle.format` to `formatPattern`.

    `formatPattern` only accepts valid `Patterns` as the first argument. In
    practice, you'll want to first retrieve a raw message from the bundle via
    `getMessage`, and then format the value (if present) and the attributes
    separately.

    ```js
    let message = bundle.getMessage("hello");
    if (message.value) {
        bundle.formatPattern(message.value, {userName: "Alex"});
    }
    ```

    The list of all attributes defined in the message can be obtained with
    `Object.keys(message.attributes)`.

  - Throw from `formatPattern` when `errors` are not passed as an argument.

    The old `format()` method would silence all errors if the thrid argument,
    the `errors` array was not given. `formatPattern` changes this behavior
    to throwing on the first encountered error and interrupting the
    formatting.

    ```js
    try {
        bundle.formatPattern(message.value, args);
    } catch (err) {
        // Handle the error yourself.
    }
    ```

    It's still possible to pass the `errors` array as the third argument to
    `formatPattern`. All errors encountered during the formatting will be
    then appended to the array. In this scenario, `formatPattern` is
    guaranteed to never throw because of errors in the translation.

    ```js
    let errorrs = [];
    bundle.formatPattern(message.value, args, errors);
    for (let error of errors) {
        // Report errors.
    }
    ```

### `FluentResource` API

  - Remove the static `FluentResource.fromString` method.

    Parse resources by using the constructor: `new FluentResource(text)`.

  - Do not extend `Map`.

    `FluentResources` are now instances of their own class only.

  - Add `FluentResource.body`.

    The `body` field is an array storing the resource's parsed messages and
    terms.

### `FluentType` API

  - `FluentNumber` must be instantiated with a number.

    The constructor doesn't call `parseFloat` on the passed value anymore.

  - `FluentDateTime` must be instantiated with a number.

    The constructor doesn't call `new Date()` on the passed value anymore.
    The date is stored as the numerical timestamp, in milliseconds since the
    epoch.

### Formatting Changes

  - Report errors from instantiating Intl objects used for formatting.
  - Report errors from functions, including built-in functions.
  - Format numbers and dates to safe defaults in case or errors. (#410)
  - When a transform function is given, transform only `TextElements`.

## @fluent/bundle 0.13.0 (July 25, 2019)

  - Rename `fluent` to `@fluent/bundle`.

## fluent 0.13.0 (July 25, 2019)

  - Support Fluent Syntax 1.0.

    Syntax 1.0 is the same as Syntax 0.9, and the support for it in this
    release continues to be the same as in `fluent` 0.12. This note is meant
    to clearly indicate that `fluent` supports the first stable version of
    the Syntax specification.

  - Improve the fallback string in case of expression errors.

    Unresolved expressions are now printed with braces around them, e.g.
    `{missing}` rather than `missing` (#368). References to missing message
    attributes now fall back to `{messageId.attributeName}` (#370).

  - Remove the `ftl` dedent helper.

    The `ftl` dedent helper has moved to its own package, `@fluent/dedent`.
    Note that its behavior has changed slightly, too. See the
    [README][dedent-readme] for details.

    [dedent-readme]: https://www.npmjs.com/package/@fluent/dedent


## fluent 0.12.0 (March 26, 2019)

This release of `fluent` brings support for version 0.9 of the Fluent Syntax
spec. The `FluentBundle` API remains unchanged. Files written in valid Syntax
0.8 may parse differently in this release. See the compatibility note below.

  - Implement Fluent Syntax 0.9.

    Most of the changes introduced in Syntax 0.9 affect the full tooling AST
    and thus do not apply to the `fluent` package which uses a different data
    structure for the result of the parsing, optimized for the runtime
    performance.

    Syntax features deprecated in Syntax 0.8 have been removed in Syntax 0.9.
    The support for them have been removed in this release of `fluent` too.

    Consult the full Syntax 0.9 [changelog][chlog0.9] for details.

    [chlog0.9]: https://github.com/projectfluent/fluent/releases/tag/v0.9.0

### Backward-incompatible changes:

- `VariantLists` are no longer valid syntax.


## fluent 0.11.0 (February 15, 2019)

  - Add the `allowOverrides` option to `FluentBundle.addResource`. (#332)

    `FluentBundle.addResource` and `FluentBundle.addMessages` now both accept
    an `options` object as the last argument. The `allowOverrides` option may
    be used to control whether it's allowed to override existing mesages or
    terms with new values. The default is `false`.


## fluent 0.10.0 (December 13, 2018)

This release of `fluent` brings support for version 0.8 of the Fluent Syntax
spec. The `FluentBundle` API remains unchanged. Files written in valid Syntax
0.7 may parse differently in this release. See the compatibility note below.

  - Implement Fluent Syntax 0.8. (#303)

    This is only a quick summary of the spec changes in Syntax 0.8. Consult the
    full [changelog][chlog0.8] for details.

    [chlog0.8]: https://github.com/projectfluent/fluent/releases/tag/v0.8.0

    In multiline `Patterns`, all common indent is now removed from each
    indented line in the final value of the pattern.

    ```properties
    multiline =
        This message has 2 spaces of indent
          on the second line of its value.
    ```

    `Terms` can now be parameterized via the call expression syntax. Only
    variables defined between the parentheses in the message a term is used in
    will be available inside of it.

    ```properties
    # A parametrized Term with a Pattern as a value.
    -thing = { $article ->
       *[definite] the thing
        [indefinite] a thing
    }

    this = This is { -thing(article: "indefinite") }.
    ```

    `VariantLists` are now deprecated and will be removed from the Syntax
    before version 1.0.

    All escapes sequences can only be used in `StringLiterals` now (see below).
    `\UHHHHHH` is a new escape sequence format suitable for codepoints above
    U+FFFF, e.g. `{"\U01F602"}`.

### Backward-incompatible changes:

  - The backslash character (`\`) is now considered a regular character in
    `TextElements`. It's no longer possible to use escape sequences in
    `TextElements`. Please use `StringLiterals` instead, e.g. `{"\u00A0"}`.
  - The closing curly brace character (`}`) is not allowed in `TextElements`
    now. Please use `StringLiterals` instead: `{"}"}`.


## fluent 0.9.1 (October 23, 2018)

  - Forbid messages with `null` values and no attributes. (#299)

    Fix a parser behavior which caused it to parse messages without values
    nor attributes as `"message-id": null`. This skewed the return values of
    `FluentBundle.hasMessage` which would report `true` for messages which
    were `null`. This, in turn, would break code which assumed
    `FluentBundle.getMessage` would always return non-`null` values if it was
    guarded by a call to `hasMessage` first.


## fluent 0.9.0 (October 23, 2018)

This release of `fluent` brings support for version 0.7 of the Fluent Syntax
spec. The `FluentBundle` API remains unchanged. Files written in valid Syntax
0.6 may parse differently in this release. See the compatibility note below.

  - Implement Fluent Syntax 0.7. (#287)

    The major new feature of Syntax 0.7 is the relaxation of the indentation
    requirement for all non-text elements of patterns. It's finally possible
    to leave the closing brace of select expressions unindented:

        emails = { $unread_email_count ->
            [one] You have one unread email.
           *[other] You have { $unread_email_count } unread emails.
        }

    Consult the [changelog](https://github.com/projectfluent/fluent/releases/tag/v0.7.0)
    to learn about other changes in Syntax 0.7.

  - Re-write the runtime parser. (#289)

    Syntax 0.7 was an opportunity to completely re-write the runtime parser,
    which was originally created in the pre-0.1 era of Fluent. It's now less
    than a half of the code size of the old parser and also slightly faster.

    The parser takes an optimistic approach to parsing. It focuses on
    minimizing the number of false negatives at the expense of increasing the
    risk of false positives. In other words, it aims at parsing valid Fluent
    messages with a success rate of 100%, but it may also parse a few invalid
    messages which the reference parser would reject. The parser doesn't
    perform strict validation of the all productions of the Fluent grammar.
    It may thus produce entries which wouldn't make sense in the real world.
    For best results users are advised to validate translations with the
    `fluent-syntax` parser pre-runtime (e.g. by using Pontoon or
    `compare-locales`).

### Backward-incompatible changes

  - Variant keys can now be either numbers (as previously) or identifiers.
    Variant keys with spaces in them produce syntax errors, e.g. `[New York]`.
  - `CR` is not a valid EOL character anymore. Please use `LF` or `CRLF`.
  - `Tab` is not recognized as syntax whitespace. It can only be used in
    translation content.


## fluent 0.8.1 (September 27, 2018)

  - Expose `FluentResource` as an export. (#286)

  `FluentResource` is a data structure representing a parsed Fluent document.
  It can be used to cache resources which can then be added to `FluentBundle`
  via the `addResource` method. To create a `FluentResource` given a string
  of Fluent translations, use the static `FluentResource.fromString` method.

  ```js
  let resource = FluentResource.fromString(text);
  bundle.addResource(resource);
  ```

  The undocumented `_parse` export was also removed in favor of
  `FluentResource.fromString`.

## fluent 0.8.0 (August 20, 2018)

  - Rename `MessageContext` to `FluentBundle`. (#222)

    The following renames have been made to the public API:

    - Rename `MessageContext` to `FluentBundle`.
    - Rename `MessageArgument` to `FluentType`.
    - Rename `MessageNumberArgument` to `FluentNumber`.
    - Rename `MessageDateTimeArgument` to `FluentDateTime`.

  - Move `mapContext*` functions to [`fluent-sequence`][]. (#273)

    The `mapContextSync` and `mapContextAsync` functions previously exported
    by the `fluent` package have been moved to the new [`fluent-sequence`][]
    package. [`fluent-sequence`][] 0.1.0 corresponds to the exact
    implementation of these functions from `fluent` 0.7.0.

    In later versions of [`fluent-sequence`][], these functions are called
    `mapBundleSync` and `mapBundleAsync`.

[`fluent-sequence`]: https://www.npmjs.com/package/fluent-sequence

## fluent 0.7.0 (July 24, 2018)

  - Implement support for Fluent Syntax 0.6.

    Syntax 0.6 keeps the syntax unchanged and makes many small changes to the
    previousl underspecified areas of the spec. The runtime parser now
    supports Unicode escapes and properly trims whitespace in TextElements.

  - Add `FluentResource`. (#244)

    `FluentResource` is a class representing a parsed Fluent document. It was
    added with caching in mind. It's now possible to parse a Fluent document
    inton an instance of `FluentResouce` once and use it to construct new
    `MessageContexts`. For this end, `MessageContext` now has the
    `addResource` method which takes an instance of `FluentResource`.

  - Add the `transform` option to `MessageContext`. (#213)

    `MessageContext` now accepts a new option, `transform`, which may be a
    function. If passed it will be used to transform the string parts of
    patterns. This may be used to implement programmatic transformations of
    translations, e.g. to create pseudo-localizations.

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

  - Move `CachedSyncIterable` and `CachedAsyncIterable` to a dependency.

    They are now available from the `cached-iterable` package. `fluent`
    depends on it for running tests.

## fluent 0.6.4 (April 11, 2018)

  - Minor optimization to bidirectionality isolation
  - Added error logging when attempting an already registered message id

## fluent 0.6.3 (February 9, 2018)

  - Update sinon to 4.2.2

## fluent 0.6.2 (February 8, 2018)

  - Correctly parse empty comment lines. (#149)
  - Forbid null attribute and variant values. (part of #150)

## fluent 0.6.0 (January 31, 2018)

  - Implement Fluent Syntax 0.5.

    - Add support for terms.
    - Add support for `#`, `##` and `###` comments.
    - Remove support for tags.
    - Add support for `=` after the identifier in message and term
      defintions.
    - Forbid newlines in string expressions.
    - Allow trailing comma in call expression argument lists.

    In fluent 0.6.x the new Syntax 0.5 is supported alongside the old Syntax
    0.4. This should make migrations easier. The parser will correctly parse
    Syntax 0.4 comments (prefixed with `//`), sections and message
    definitions without the `=` after the identifier. The one exception are
    tags which are no longer supported. Please use attributed defined on
    terms instead.

  - Add `mapContextAsync`. (#125)

    This is the async counterpart to mapContextSync. Given an async iterable
    of `MessageContext` instances and an array of ids (or a single id), it
    maps each identifier to the first `MessageContext` which contains the
    message for it.

    An ordered interable of `MessageContext` instances can represent the
    current negotiated fallback chain of languages. This iterable can be used
    to find the best existing translation for a given identifier.

    The iterable of `MessageContexts` can now be async, allowing code like
    this:

    ```js
    async formatString(id, args) {
        const bundle = await mapContextAsync(bundles, id);

        if (bundle === null) {
            return id;
        }

        const msg = bundle.getMessage(id);
        return bundle.format(msg, args);
    }
    ```

    The iterable of `MessageContexts` should always be wrapped in
    `CachedIterable` to optimize subsequent calls to `mapContextSync` and
    `mapContextAsync`.

    Because `mapContextAsync` uses asynchronous iteration you'll likely need
    the regenerator runtime provided by `babel-polyfill` to run the `compat`
    builds of `fluent`.

  - Expose the `ftl` dedent helper.

    The `ftl` template literal tag can be used to conveniently include FTL
    snippets in other code. It strips the common indentation from the snippet
    allowing it to be indented on the level dictated by the current code
    indentation.

    ```js
    bundle.addMessages(ftl`
        foo = Foo
        bar = Bar
    );
    ```

  - Remove `MessageContext.formatToParts`.

    It's only use-case was passing React elements as arguments to
    translations which is now possible thanks to DOM overlays (#101).

  - Rename `FluentType.valueOf` to `FluentType.toString1.

    Without `MessageContext.formatToParts`, all use-cases for
    `FluentType.valueOf` boil down to stringification.

  - Remove `FluentType.isTypeOf`.

    fluent-react's markup overlays (#101) removed the dependency on fluent's
    `FluentType` which was hardcoded as an import from fluent/compat. Without
    this dependency all imports from fluent are in the hands of developers
    again and they can decide to use the ES2015+ or the compat builds as they
    wish. As long as they do it consistently, regular instanceof checks will
    work well.


## fluent 0.4.2 (November 27, 2017)

  - Add touchNext to CachedIterable.

    This allows the user of CachedIterable to trigger construction of an
    element yielded from the generator early.

  - Add the static FluentType.isTypeOf method.

    In some cases, bundlers such as Webpack would break the instanceof
    FluentType check. The new FluentType.isTypeOf static method can be used
    instead to guarantee the proper behavior.

  - Catch errors thrown by Intl formatters.


## fluent 0.4.1 (June 22, 2017)

  - Introduce mapContextSync and CachedIterable.

    An ordered iterable of MessageContext instances can represent the
    current negotiated fallback chain of languages.  This iterable can be
    used to find the best existing translation for a given identifier.

    The mapContext* methods can be used to find the first MessageContext in
    the given iterable which contains the translation with the given
    identifier.  If the iterable is ordered according to the result of
    a language negotiation the returned MessageContext contains the best
    available translation.

    A simple function which formats translations based on the identifier
    might be implemented as follows:

        getString(id, args) {
            const bundle = mapContextSync(bundles, id);

            if (bundle === null) {
                return id;
            }

            const msg = bundle.getMessage(id);
            return bundle.format(msg, args);
        }

    In order to pass an iterator to mapContext*, wrap it in CachedIterable.
    This allows multiple calls to mapContext* without advancing and
    eventually depleting the iterator.

        function *generateMessages() {
            // Some lazy logic for yielding MessageContexts.
            yield *[bundle1, bundle2];
        }

        const bundles = new CachedIterable(generateMessages());
        const bundle = mapContextSync(bundles, id);


## fluent 0.4.0 (May 17th, 2017)

  - Added MessageContext.hasMessage and MessageContext.getMessage methods.

    Using the MessageContext.messages map for getting raw messages is
    deprecated now.  Instead, use the two dedicated methods: hasMessage and
    getMessage.

    Before:

        const msg = bundle.messages.get(id);
        const txt = bundle.format(msg);

    Now:

        const msg = bundle.getMessage(id);
        const txt = bundle.format(msg);

  - The compat build is now transpiled using rollup-plugin-babel.

    This ensures that the "use strict" pragma is scoped to the UMD wrapper.  It
    also correctly parses the top-level "this" keyword (which the previous
    setup turned into "undefined").

## fluent 0.3.1

  - MessageContext takes one locale (a string) or an array of locales.
  - Add the "module" field to package.json for ES modules-compatible bundlers.

## fluent 0.3.0

  - Support Fluent Syntax 0.3

    Added support for tags and indented multiline text. Removed quoted values.

## fluent 0.2.2

### Breaking changes

  - (ef99a62) Remove the custom `Intl.PluralRules` polyfill

    You'll need to provide your own polyfill or use `fluent-intl-polyfill`.

  - (1a4f2a8) Make fluent and fluent-syntax separate packages

    Install the `fluent-syntax` package to use the AST parser.

### New features

  - (73fbab8) Add `MessageContext.formatToParts`
  - (2f51e27) Export `FluentNumber` as `MessageArgument`
  - (de01c8b) Provide a compat version using babel-preset-latest

    Use it by importing from `fluent/compat'

### Other

  - (44fa872) Remove a special case for `FluentNumber` in `SelectExpression`
  - (7dfa787) Remove namespaces from keywords
  - (2fff487) Use `FluentNumber`'s value when matching `FluentKeywords`
  - (b4bcbdd) Remove tests which were causing parsing errors
  - (0f35313) Name the AMD module 'fluent'

## fluent 0.2.1

  - (d247e5d) npm install fluent
  - (d00fe3a) Remove `JunkEntries` from the RuntimeParser

## fluent 0.2.0

  - (1f86c8f) Update the AST parser to Syntax 0.2
  - (679ca3e) Update the Runtime parser to Syntax 0.2
  - (d3681d7) Update the resolver to Syntax 0.2.
  - (bfea90e) Rename `Entity` to `Message`
  - (5efd0f9) Remove `FTLList`
  - (282cccb) Add `JunkEntry` to AST parser
  - (a78a32a) Add `lineNumber` and `columnNumber` to SyntaxErrors
  - (e0245f4) Always print JSON in tools/parse
  - (5d788b7) Move the AST parser to src/syntax

## fluent 0.1.0

  - (0d38714) Fluent.js 0.1

    The initial release based on l20n.js c3e35c4.
