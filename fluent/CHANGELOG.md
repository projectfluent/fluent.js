# Changelog

## Unreleased

  - …

## fluent 0.4.0 (May 17th, 2017)

  - Added MessageContext.hasMessage and MessageContext.getMessage methods.

    Using the MessageContext.messages map for getting raw messages is
    deprecated now.  Instead, use the two dedicated methods: hasMessage and
    getMessage.

    Before:

        const msg = ctx.messages.get(id);
        const txt = ctx.format(msg);

    Now:

        const msg = ctx.getMessage(id);
        const txt = ctx.format(msg);

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
