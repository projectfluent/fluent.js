# Changelog

## Unreleased

  - The compat build is now transpiled using rollup-plugin-babel.

    This ensures that the "use strict" pragma is scoped to the UMD wrapper.  It
    also correctly parses the top-level "this" keyword (which the previous
    setup turned into "undefined").

## fluent-intl-polyfill 0.1.0

  - intl-pluralrules is now bundled with fluent-intl-polyfill

## fluent-intl-polyfill 0.0.1

  - (ef99a62) Merge pull request #8 from stasm/intl-polyfill

    The initial release.
