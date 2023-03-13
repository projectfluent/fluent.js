# Changelog

## [0.9.0](https://github.com/projectfluent/fluent.js/compare/@fluent/dom@0.8.1...@fluent/dom@0.9.0) (2023-03-13)

- Drop Node.js v12 support, add v18 & latest to CI tests
  ([#607](https://github.com/projectfluent/fluent.js/pull/607))
- Use `/** comments */` where appropriate

## [@fluent/dom 0.8.1](https://github.com/projectfluent/fluent.js/compare/@fluent/dom@0.8.0...@fluent/dom@0.8.1) (2021-12-21)

- Add `.js` extension to imports
  ([#581](https://github.com/projectfluent/fluent.js/pull/581))

## @fluent/dom 0.8.0 (September 13, 2021)

- Remove `"type": "commonjs"` from the package's root `package.json`.
  ([#556](https://github.com/projectfluent/fluent.js/pull/556))
- Set Node.js 12 as the minimum supported version
  ([#557](https://github.com/projectfluent/fluent.js/pull/557))

## @fluent/dom 0.7.0 (July 2, 2020)

- Remove the `compat.js` build and compile everything to ES2018. (#472, #474)

  The source code is now compiled by the TypeScript's compiler, `tsc`, to
  ES2018 files in the `esm/` directory. These files are then bundled into a
  single `index.js` UMD file without any further transpilation.

  The `compat.js` build (available as `@fluent/dom/compat`) was removed.
  Please use your own transpilation pipeline if ES2018 is too recent for
  your project.

  Refer to https://github.com/projectfluent/fluent.js/wiki/Compatibility
  for more information

## @fluent/dom 0.6.0 (August 21, 2019)

- Update `@fluent/dom` to work with `@fluent/bundle` 0.14

## @fluent/dom 0.5.0 (July 25, 2019)

- Rename `fluent-dom` to `@fluent/dom`.

## fluent-dom 0.5.0 (July 25, 2019)

- Deprecate `fluent-dom` in favor of `@fluent/dom`.

## fluent-dom 0.4.2

- Minimize attribute churn when retranslating DOM Overlays (#354)
- Minor DOMOverlays alignments with the Gecko implementation.
- fix SyntaxError on Edge (#405)

## fluent-dom 0.4.1

- Package dist files.

## fluent-dom 0.4.0

- Drop support for IE and old evergreen browsers. (#133)

  Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
  iOS Safari 10.3+ and node 8.9+.

- Add the `cached-iterable` runtime dependency.

  `CachedAsyncIterable` is now available from its own package rather than
  from the `fluent` package.

- Modify the constructor to not require `window `element to be passed.

## fluent-dom 0.3.0

- Refactor the overlay sanitization methods into separate functions. (#189)
- Separate out CachedIterable and CachedAsyncIterable, and add a param to touchNext. (#191)
- Localization.formatValues should accept an array of objects. (#198)
- Allow adding and removing resource Ids from a Localization. (#197)

## fluent-dom 0.2.0

- DOM Overlays v2 (#168)
  Major refactor of DOM Overlays allowing developers to provide node elements as attributes.
- Refactored error reporting (#160)
- Fixed a minor bug which caused an extranous retranslation when `data-l10n-id` was
  being removed from an element.

## fluent-dom 0.1.0

- Extend formatWithFallback to accept async iterator (#46)
- Documented all methods
- Removed `DOMLocalization.prototype.translateRoot` method
- Simplified initial version of DOM Overlays (to be extended in 0.2) (#71)
  - Only children of the white-listed types are allowed now. It's not possible
    anymore to put elements of other types in the source HTML to make exceptions.
  - The identity of the source element's children is explicitly not kept
    anymore. This allows us to treat the translation DocumentFragment as the
    reference for iteration over child nodes.
  - The overlay function is also no longer recursive. Any nested HTML
    will be lost and only its textContent will be preserved.
- Added `data-l10n-attrs` to allow for whitelisting localizable attributes (#70)
- Added a guard to prevent registering nested roots (#72)
- Added a guard to prevent leaking attributes between translations (#73)
- Added a performance optimization coalescing all translations from mutations
  per animation frame (#113)

## fluent-dom 0.0.1

- Introduce Fluent bindings for DOM.

  The initial release.
