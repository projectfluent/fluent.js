# Changelog

## Unreleased

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
