# Changelog

## Unreleased

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

  - The compat build is now transpiled using rollup-plugin-babel.

    This ensures that the "use strict" pragma is scoped to the UMD wrapper.  It
    also correctly parses the top-level "this" keyword (which the previous
    setup turned into "undefined").

## fluent-intl-polyfill 0.1.0

  - intl-pluralrules is now bundled with fluent-intl-polyfill

## fluent-intl-polyfill 0.0.1

  - (ef99a62) Merge pull request #8 from stasm/intl-polyfill

    The initial release.
