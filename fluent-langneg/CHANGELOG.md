# Changelog

## [@fluent/langneg 0.6.1](https://github.com/projectfluent/fluent.js/compare/@fluent/langneg@0.6.0...@fluent/langneg@0.6.1) (2021-12-21)

  - Add zh-mo and zh-tw to likely subtags
    ([#570](https://github.com/projectfluent/fluent.js/pull/570))
  - Add `.js` extension to imports
    ([#581](https://github.com/projectfluent/fluent.js/pull/581))

## @fluent/langneg 0.6.0 (September 13, 2021)

  - Remove `"type": "commonjs"` from the package's root `package.json`, but add
    `"type": "module"` to the `esm/` directory.
    ([#556](https://github.com/projectfluent/fluent.js/pull/556),
    [#567](https://github.com/projectfluent/fluent.js/pull/567))
  - Set Node.js 12 as the minimum supported version
    ([#557](https://github.com/projectfluent/fluent.js/pull/557))
  - Remove circular dependency
    ([#545](https://github.com/projectfluent/fluent.js/pull/545))

## @fluent/langneg 0.5.2 (April 17, 2021)

  - Documentation fix. (#547)

## @fluent/langneg 0.5.1 (April 9, 2021)

  - Better TypeScript annotations. (#525)

    Make array arguments read-only, and expose options type.


## @fluent/langneg 0.5.0 (July 2, 2020)

  - Remove the `compat.js` build and compile everything to ES2018. (#472)

    TypeScript source code is now compiled to ES2018 files in the `esm/`
    directory. These files are then bundled into a single `index.js` UMD file
    without any further transpilation.

    The `compat.js` build (available as `@fluent/langneg/compat`) was removed.
    Please use your own transpilation pipeline if ES2018 is too recent for
    your project.

    Refer to https://github.com/projectfluent/fluent.js/wiki/Compatibility
    for more information.

## @fluent/langneg 0.4.0 (March 31, 2020)

  - Migrate `@fluent/langneg` to TypeScript. (#462)

    There are no functional nor API changes in this release.

## @fluent/langneg 0.3.0 (July 25, 2019)

  - Rename `fluent-langneg` to `@fluent/langneg`.

## fluent-langneg 0.3.0 (July 25, 2019)

  - Deprecate `fluent-langneg` in favor of `@fluent/langneg`.

## fluent-langneg 0.2.0 (July 1, 2019)

  - Accept language variant tags as defined by UTS35. (#381)

## fluent-langneg 0.1.1 (February 7, 2019)

  - Align the algorithm with C++/Rust implementations to fix the `zh-HK` scenario (#335)

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

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
