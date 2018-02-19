# Changelog

## fluent-react 0.6.1 (February 19, 2018)

  - Preserve children of wrapped components if translation value is null. (#154)

    `<Localized>` now special-cases translations with null values; it
    preserves the original children of the wrapped element and only sets
    translated attributes.

  - Protect void elements from translations which try to set children. (#155)

    A broken translation may have a value where none is expected.
    `<Localized>` components now protect wrapped void elements from having
    this unexpected value inserted as children.

  - Add a third argument to getString for fallback. (#147)

    The new third argument to the `getString` function in `withLocalized`
    wrapped components allows for definition of a fallback message in case
    the message id is not fount in the message context. The fallback message
    may also be used for extraction of source copy.

## fluent-react 0.6.0 (February 1, 2018)

  - Allow limited markup in translations. (#101)

    Translations in Fluent can now include simple HTML-like markup. Elements
    found in translations will be matched with props passed to `<Localized>`.
    These props must be React elements. Their content will be replaced by the
    localizable content found for the corrensponding markup in the
    translation.

    This is a breaking change from `fluent-react` 0.4.1. See migration notes
    below.

    ```properties
    send-comment = <confirm>Send</confirm> or <cancel>go back</cancel>.
    ```

    ```js
    <Localized
        id="send-comment"
        confirm={
            <button onClick={sendComment}></button>
        }
        cancel={
            <Link to="/"></Link>
        }
    >
        <p>{'<confirm>Send</confirm> or <cancel>go back</cancel>.'}</p>
    </Localized>
    ```

    The rendered result will include the props interpolated into the
    translation:

    ```js
    <p>
        <button onClick={sendComment}>Send</button> or <Link to="/">go back</Link>.
    </p>
    ```

    When naming markup elements it's possible to use any name which is a
    valid prop name. Translations containing markup will be parsed using a
    hidden `<template>` element. It creates a safe inert `DocumentFragment`
    with a hierarchy of text nodes and HTML elements. Any unknown elements
    (e.g. `cancel` in the example above) are parsed as `HTMLUnknownElements`.
    `fluent-react` then tries to match all elements found in the translation
    with props passed to the `<Localized>` component. If a match is found,
    the element passed as a prop is cloned with the translated text content
    taken from the `DocumentFragment` used as `children`.

  - Filter props with <Localized attrs={{…}}>. (#139, #141)

    The `<Localized>` component now requires the `attrs` prop to set any
    localized attributes as props on the wrapped component. `attrs` should be
    an object with attribute names as keys and booleans as values.

    ```jsx
    <Localized id="type-name" attrs={{placeholder: true}}>
        <input
            type="text"
            placeholder="Localizable placeholder"
            value={name}
            onChange={…}
        />
    </Localized>
    ```

    By default, if `attrs` is not passed, no attributes will be set. This is
    a breaking change compared to the previous behavior: in `fluent-react`
    0.4.1 and before `<Localized>` would set _all_ attributes found in the
    translation.

#### Migrating from `fluent-react` 0.4.1 to 0.6.0

##### Add attrs to Localized.

If you're setting localized attributes as props of elements wrapped in
`<Localized>`, in `fluent-react` 0.6.0 you'll need to also explicitly allow
the props you're interested in using the `attrs` prop. This protects your
components from accidentally gaining props they aren't expecting or from
translations overwriting important props which shouldn't change.

```jsx
// BEFORE (fluent-react 0.4.1)
<Localized id="type-name">
    <input
        type="text"
        placeholder="Localizable placeholder"
        value={name}
        onChange={…}
    />
</Localized>
```

```jsx
// AFTER (fluent-react 0.6.0)
<Localized id="type-name" attrs={{placeholder: true}}>
    <input
        type="text"
        placeholder="Localizable placeholder"
        value={name}
        onChange={…}
    />
</Localized>
```

##### Don't pass elements as $arguments.

In `fluent-react` 0.4.1 it was possible to pass React elements as _external
arguments_ to localization via the `$`-prefixed props, just like you'd pass
a number or a date. This was a bad localization practice because it
resulted in the translation being split into multiple strings.

```properties
# Bad practice. This won't work in fluent-react 0.6.0.
send-comment-confirm = Send
send-comment-cancel = go back
send-comment = { $confirmButton } or { $cancelLink }.
```

```jsx
// Bad practice. This won't work in fluent-react 0.6.0.
<Localized
    id="send-comment"
    $confirmButton={
        <Localized id="send-comment-confirm">
            <button onClick={sendComment}>{'Send'}</button>
        </Localized>
    }
    $cancelLink={
        <Localized id="send-comment-cancel">
            <Link to="/">{'go back'}</Link>
        </Localized>
    }
>
    <p>{'{ $confirmButton } or { $cancelLink}.'}</p>
</Localized>
```

`fluent-react` 0.6.0 removes support for this feature. It is no longer
possible to pass React elements as `$`-prefixed _arguments_ to translations.
Please migrate your code to use markup in translations and pass React
elements as _props_ to `<Localized>`.

In the example above, change `$confirmButton` to `confirm` and `$cancelLink`
to `cancel`. Note that you don't need to wrap the passed element in another
`<Localized>` anymore. In particular, you don't need to assign a new message
id for it. The text for this element will be taken from the `send-comment`
message which can now include the markup for the button and the link.

```properties
send-comment = <confirm>Send</confirm> or <cancel>go back</cancel>.
```

```jsx
// BEFORE (fluent-react 0.4.1)
<Localized
    id="send-comment"
    $confirmButton={
        <Localized id="send-comment-button">
            <button onClick={sendComment}>{'Send'}</button>
        </Localized>
    }
    $cancelLink={
        <Localized id="send-comment-cancel">
            <Link to="/">{'go back'}</Link>
        </Localized>
    }
>
    <p>{'{ $confirmButton } or { $cancelLink}.'}</p>
</Localized>
```

```jsx
// AFTER (fluent-react 0.6.0)
<Localized
    id="send-comment"
    confirm={
        <button onClick={sendComment}></button>
    }
    cancel={
        <Link to="/"></Link>
    }
>
    <p>{'<confirm>Send</confirm> or <cancel>go back</cancel>.'}</p>
</Localized>
```

##### Use fluent 0.6.0+.

`fluent-react` 0.6.0 works best with `fluent` 0.6.0. It might still work with
`fluent` 0.4.x but passing elements as `$`-prefixed arguments to translations
will break your app. You might also run into other issues with translations
with attributes and no values. Upgrading your code to [`fluent` 0.6.0][] and
your localization files to [Fluent Syntax 0.5][] is the best way to avoid
troubles.

[`fluent` 0.6.0]: https://github.com/projectfluent/fluent.js/releases/tag/fluent%400.6.0
[Fluent Syntax 0.5]: https://github.com/projectfluent/fluent/releases/tag/v0.5.0

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
