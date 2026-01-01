# Changelog

## [0.5.0](https://github.com/projectfluent/fluent.js/compare/@fluent/dedent@0.4.0...@fluent/dedent@0.5.0) (2023-03-13)

- Drop Node.js v12 support, add v18 & latest to CI tests
  ([#607](https://github.com/projectfluent/fluent.js/pull/607))

## @fluent/dedent 0.4.0 (September 13, 2021)

- Remove `"type": "commonjs"` from the package's root `package.json`, but add
  `"type": "module"` to the `esm/` directory.
  ([#556](https://github.com/projectfluent/fluent.js/pull/556),
  [#567](https://github.com/projectfluent/fluent.js/pull/567))
- Set Node.js 12 as the minimum supported version ([#557](https://github.com/projectfluent/fluent.js/pull/557))

## @fluent/dedent 0.3.0 (July 2, 2020)

- Remove the `compat.js` build and compile everything to ES2018. (#472)

  TypeScript source code is now compiled to ES2018 files in the `esm/`
  directory. These files are then bundled into a single `index.js` UMD file
  without any further transpilation.

  The `compat.js` build (available as `@fluent/dedent/compat`) was removed.
  Please use your own transpilation pipeline if ES2018 is too recent for
  your project.

  Refer to https://github.com/projectfluent/fluent.js/wiki/Compatibility
  for more information

## @fluent/dedent 0.2.0 (March 2, 2020)

- Migrate `@fluent/dedent` to TypeScript. (#451)

  There are no functional nor API changes in this release.

## @fluent/dedent 0.1.0 (May 23, 2019)

This is the first release of `@fluent/dedent` as an independent package. It's
based on the `ftl` template tag from the `fluent` package, but the behavior
has changed and the code has been refactored.

The behavior in this version is largely based on the [multiline strings
specification in Swift][1]. See the `README.md` for more details.

[1]: https://docs.swift.org/swift-book/LanguageGuide/StringsAndCharacters.html
