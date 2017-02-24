# Changelog

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
