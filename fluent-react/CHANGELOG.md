# Changelog

## Unreleased

  - …

## fluent-react 0.4.1 (June 30, 2017)

  - Relax the constraint on Localized only being valid as descendants of
    LocalizationProvider.

  - Export ReactLocalization and isReactLocalization prop-type checker.

## fluent-react 0.4.0 (June 22, 2017)

  - Upgrade to fluent 0.4.1.

  - Removed caching in `Localized`'s state until we know more about performance
    bottlenecks.

  - Added the `withLocalization` HOC.

    It may be used to connect a component with a Localization. It injects the
    `getString` prop.

  - The compat build is now transpiled using rollup-plugin-babel.

    This ensures that the "use strict" pragma is scoped to the UMD wrapper.  It
    also correctly parses the top-level "this" keyword (which the previous
    setup turned into "undefined").

## fluent-react 0.3.0

  - Removed `MessagesProvider` and replaced it with a new
    `LocalizationProvider` component.

    The `LocalizationProvider` component takes one prop: `messages`.  It should
    be an iterable of `MessageContext` instances in order of user's preferred
    languages.  This iterable will be used by `Localization` to format
    translations.  If a translation is missing in one language, `Localization`
    will fall back to the next locale.

  - The relevant `MessageContext` is now cached in `Localized`'s state.

## fluent-react 0.2.0

  - `LocalizationProvider` is now called `MessagesProvider`.

    `Localization` is now reserved for an abstraction which capable of falling
    back to translations in other negotiated languages in case of fatal errors.

## fluent-react 0.1.0

  - Re-render localizable elements only when `messages` change.

  - Remove `requestMessages`.

    Instead of taking an async function for fetching translations,
    `LocalizationProvider` now takes `messages` as a prop.  `messages` is
    simply a string; making sure it contains proper translations is developer's
    responsibility.

    This change allows for greater flexibility in integrating `fluent-react`
    into existing React apps.  For loading translations on the clientside,
    a wrapper component around `LocalizationProvider` may still be used to
    fetch async translations in its `componentWillMount` method.

## fluent-react 0.0.1

  - (751fd23) Merge pull request #9 from stasm/fluent-react

    The initial release.
