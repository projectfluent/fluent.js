# Changelog

## Unreleased

  - …

## fluent-langneg 0.0.3

  - Added `acceptedLanguages` function for parsing the Accept-Language header.

  - Added `*` as a valid value for the `requestedLocales` argument.

  - The compat build is now transpiled using rollup-plugin-babel.

    This ensures that the "use strict" pragma is scoped to the UMD wrapper.  It
    also correctly parses the top-level "this" keyword (which the previous
    setup turned into "undefined").

## fluent-langneg 0.0.2

  - Added the "module" field to package.json for ES modules-compatible
    bundlers.

  - Updated the negotiation logic to match the C++ implementation.

## fluent-langneg 0.0.1

  - Introduce Language Negotiation module for Fluent

    The initial release.
