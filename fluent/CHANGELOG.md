# Changelog

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
