# Changelog

## Unreleased

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
