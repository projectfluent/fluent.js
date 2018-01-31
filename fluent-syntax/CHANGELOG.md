# Changelog

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
