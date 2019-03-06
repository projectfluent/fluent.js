# Changelog

## Unreleased

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

## fluent-langneg 0.1.1 (February 7, 2019)

  - Align the algorithm with C++/Rust implementations to fix the `zh-HK` scenario (#335)

## fluent-langneg 0.1.0 (August 17, 2017)

  - `negotiateLanguages` is now a named export.

    In code using `fluent-langneg` please change:

        import negotiateLanguages from 'fluent-langneg';

    to:

        import { negotiateLanguages } from 'fluent-langneg';

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
