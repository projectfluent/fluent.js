# Changelog

## fluent-syntax 0.8.1 (August 1, 2018)

### Bug fixes

- Avoid forEach to make code minification-friendly. (#263)
- Don't call charCodeAt() on undefined when at EOF. (#265)

## fluent-syntax 0.8.0 (July 24, 2018)

  - Implement support for Fluent Syntax 0.6. (#253)

    Syntax 0.6 keeps the syntax unchanged but makes many changes to the AST.
    Consult https://github.com/projectfluent/fluent/releases/tag/v0.6.0
    for the list of changes.

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

## fluent-syntax 0.7.0 (April 17, 2018)

  - Add the `ref` field to `VariantExpression`.

    The `Identifier`-typed `id` field of `VariantExpression` has been removed
    and replaced by an `Expression`-typed `ref` field. The new `ref` field
    can now hold `MessageReference` nodes. The range of valid expressions for
    `ref` may be extended in the future.


## fluent-syntax 0.6.6 (March 19, 2018)

  - `Function` AST nodes have a span now. (#167)


## fluent-syntax 0.6.5 (March 8, 2018)

  - Temporarily relax the `engines` requirement. (#164)

    Include node 6.9.* LTS in the `engines` requirement to unblock
    [mozilla/addons-linter#1789][] and thus unblock langpack signing for
    Firefox 60.

    This is a temporary measure until `addons-linter` phases out the support
    for node 6 which should happen in May 2018.

    [mozilla/addons-linter#1789]: https://github.com/mozilla/addons-linter/issues/1789

## fluent-syntax 0.6.4 (March 7, 2018)

  - Whitespace-only values are now correctly parsed as null. (#159)
  - Correctly parse Patterns at EOF. (#159)
  - Serialize values with Select Expression on a new line. (#161)

## fluent-syntax 0.6.2 (February 8, 2018)

  - Inline Patterns may start with any character. (#150)

    `}`, `.`, `*` and `[` are only special when they appear at the beginning of
    indented Pattern lines. When a Pattern starts on the same line as `id =` or
    `[variant key]`, its first character doesn't carry any special meaning and
    it may be one of those four ones as well.

    This also fixes a regression from 0.6.0 where a message at the EOF without
    value nor attributes was incorrectly parsed as a message with an empty
    Pattern rather than produce a syntax error.

  - Ensure CallExpression's args are always an array, even if empty.

## fluent-syntax 0.6.0 (January 31, 2018)

  - Implement Fluent Syntax 0.5.

    - Add support for terms.
    - Add support for `#`, `##` and `###` comments.
    - Remove support for tags.
    - Add support for `=` after the identifier in message and term
      defintions.
    - Forbid newlines in string expressions.
    - Allow trailing comma in call expression argument lists.

    In fluent-syntax 0.6.x the new Syntax 0.5 is supported alongside the old
    Syntax 0.4. This should make migrations easier.

    `FluentParser` will correctly parse Syntax 0.4 comments (prefixed with
    `//`), sections and message definitions without the `=` after the
    identifier. The one exception are tags which are no longer supported.
    Please use attributed defined on terms instead.

    `FluentSerializer` always serializes using the new Syntax 0.5.

  - Add `AST.Placeable` (#64)

    Added in Syntax Spec 0.4, `AST.Placeable` provides exact span data about
    the opening and closing brace of placeables.

  - Expose `FluentSerializer.serializeExpression`. (#134)

  - Serialize standalone comments with surrounding white-space.

  - Allow blank lines inside of messages. (#76)

  - Trim trailing newline from Comments. (#77)


## fluent-syntax 0.5.0 (June 23rd, 2017)

  - Most AST nodes can now have a Span.

    Use `new FluentParser({ withSpans: true })` to enable this behavior.

  - The `withAnnotations` config option to `FluentParser` has been removed.

    The parser always produces Annotations if necessary now.


## fluent-syntax 0.4.0 (May 17th, 2017)

  - Introduce the FluentParser and the FluentSerializer classes.

    Instances can be used to store config for multiple parse/serialize
    operations.

    The fluent-syntax package still exports the `parse` and `serialize`
    helpers.  For more fine-grained control, `FluentParser` and
    `FluentSerializer` may be used for instantiation.

  - Build compat.js using babel-plugin-transform-builtin-extend.

    This ensures the correct behavior of `err instanceof ParseError`.

  - The compat build is now transpiled using rollup-plugin-babel and
    babel-plugin-transform-builtin-extend.

    This ensures that the "use strict" pragma is scoped to the UMD wrapper.  It
    also correctly parses the top-level "this" keyword (which the previous
    setup turned into "undefined").

## fluent-syntax 0.3.0

  - JSON is now supported as a transport format for the AST.
  - Annotations are now properly serialized and deserialized.
  - Spans are now proper AST nodes with { start, end } fields.
  - Added parseEntry and serializeEntry functions.

## fluent-syntax 0.2.0

  - Updated parser to Fluent Syntax 0.3

    Added support for tags and indented multiline text. Removed quoted values.

  - Added the Serializer module

    ```javascript
      import { parse } from '../src/parser';
      import { serialize } from '../src/serializer';

      function pretty(text) {
        const ast = parse(text);
        return serialize(ast);
      }
    ```


## fluent-syntax 0.1.1

  - (fbfa521) Add spans and annotations to Entries

    The `parse` function no longer returns a [Resource, error] tuple. Instead
    it returns the Resource.  Errors are now stored in the `annotations` field
    of each entry.  Errors are instances of the `ParseError` class.

    `Entry` instances also gain the `span: { from, to }` field with indexes
    relative to the beginning of the file.

    `JunkEntry` is now called `Junk`.

    `lineOffset` and `columnOffset` are now available as named exports.

  - (0f35313) Build AMD modules with names
  - (de01c8b) Provide a compat version using babel-preset-latest

    Use it by importing from `fluent-syntax/compat'

## fluent-syntax 0.1.0

  - (1a4f2a8) Make fluent and fluent-syntax separate packages
