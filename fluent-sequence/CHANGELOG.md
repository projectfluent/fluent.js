# Changelog

## @fluent/sequence 0.7.0 (September 13, 2021)

- Remove `"type": "commonjs"` from the package's root `package.json`, but add
  `"type": "module"` to the `esm/` directory.
  ([#556](https://github.com/projectfluent/fluent.js/pull/556),
  [#567](https://github.com/projectfluent/fluent.js/pull/567))
- Set Node.js 12 as the minimum supported version
  ([#557](https://github.com/projectfluent/fluent.js/pull/557))

## @fluent/sequence 0.6.0 (July 2, 2020)

- Remove the `compat.js` build and compile everything to ES2018. (#472)

  TypeScript source code is now compiled to ES2018 files in the `esm/`
  directory. These files are then bundled into a single `index.js` UMD file
  without any further transpilation.

  The `compat.js` build (available as `@fluent/sequence/compat`) was removed.
  Please use your own transpilation pipeline if ES2018 is too recent for
  your project.

  Refer to https://github.com/projectfluent/fluent.js/wiki/Compatibility
  for more information.

## @fluent/sequence 0.5.0 (March 2, 2020)

- Migrate `@fluent/sequence` to TypeScript. (#450)

  There are no functional nor API changes in this release.

## @fluent/sequence 0.4.0 (July 25, 2019)

- Rename the peer dependency to `@fluent/bundle`.

## @fluent/sequence 0.3.0 (July 25, 2019)

- Rename `fluent-sequence` to `@fluent/sequence`.

## fluent-sequence 0.3.0 (July 25, 2019)

- Deprecate `fluent-sequence` in favor of `@fluent/sequence`.

## fluent-sequence 0.2.0 (August 20, 2018)

- Rename `mapContextSync` to `mapBundleSync`. (#276)
- Rename `mapContextAsync` to `mapBundleAsync`. (#276)

- Declare `fluent` as peer dependency.

  `fluent-sequence` works well with any `fluent` version of `0.4.0` or
  above.

## fluent-sequence 0.1.0 (August 17, 2018)

The initial release based on `fluent` 0.7.0.
