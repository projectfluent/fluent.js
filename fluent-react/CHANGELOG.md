# Changelog

## Unreleased

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
