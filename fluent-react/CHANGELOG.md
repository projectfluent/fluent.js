# Changelog

## @fluent/react 0.10.0 (July 30, 2019)

  - Update to `@fluent/bundle` 0.14.0.

    This version of `@fluent/react` can be used with the new `FluentBundle`
    API released in `@fluent/bundle` 0.14.0.

  - Report formatting errors from `Localized` and `getString`. (#412)

    Formatting errors are now printed to the console. In the future,
    `@fluent/react` will allow finer-grained control over rpeorting errors.
    See #411.

## @fluent/react 0.9.0 (July 25, 2019)

  - Rename `fluent-react` to `@fluent/react`.
  - Rename the runtime dependency to `@fluent/sequence`.
  - Rename the peer dependency to  `@fluent/bundle`.

## fluent-react 0.9.0 (July 25, 2019)

  - Deprecate `fluent-react` in favor of `@fluent/react`.

## fluent-react 0.8.5 (July 25, 2019)

  - Accept `fluent` 0.13.x as a peer dependency.
  - Fix the rendering of empty `<Localized/>`. (#378)

## fluent-react 0.8.4 (March 29, 2019)

  - Accept `fluent` 0.11.x and 0.12.x as a peer dependency.

## fluent-react 0.8.3 (December 13, 2018)

  - Accept `fluent` 0.10.x as a peer dependency.

## fluent-react 0.8.2 (October 25, 2018)

  - Allow `<Localized>` with no children elements. (#230)

    It's now possible to use string literals as children to `<Localized>`.
    Previously, the string would need to be wrapped in a `<span>` or some
    other element. Thanks to @blushingpenguin for this contribution!

    ```
    <Localized id="message">
        String fallback.
    </Localized>
    ```

  - Accept `fluent` 0.9.x as a peer dependency.

  - Only format attributes defined in `<Localized attrs=…>`.

    A tiny optimization to avoid formatting attributes found in the
    localization which would be rejected by the sanitization logic in
    `<Localized>` anyways.

## fluent-react 0.8.1 (August 28, 2018)

  - Change the `fluent` peer dependency to 0.8.x.

    Pin down the version of the `fluent` peer dependency to 0.8.x in case there
    are any breaking API changes in future its versions.

## fluent-react 0.8.0 (August 21, 2018)

  - Rename the `messages` prop to `bundles`. (#222)

    `<LocalizationProvider>` now expects an iterable of `FluentBundles` to be
    passed as the `bundles` prop, rather than `messages`.

  - Allow custom `parseMarkup` functions. (#233)

    By default, `fluent-react` uses a `<template>` element to parse and
    sanitize markup in translations. In some scenarios like server-side
    rendering (SSR) or apps written in React Native, `<template>` is not
    available natively. In these situations a custom parseMarkup can be
    passed as a prop to `<LocalizationProvider>`. It will be used by all
    `<Localized>` components under it. See the [wiki for details](https://github.com/projectfluent/fluent.js/wiki/React-Overlays#custom-markup-parsers).

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

  - Add the `cached-iterable` runtime dependency.

    `CachedSyncIterable` is now available from its own package rather than
    from the `fluent` package.

  - Add the `fluent-sequence` runtime dependency.

    `mapBundleSync` is now available from its own package rather than from
    the `fluent` package.

  - Define `fluent >= 0.8.0` as a peer dependency.

## fluent-react 0.7.0 (May 18, 2018)

  - Protect void elements against translated text content. (#174)

    Text content found in the translated markup is now ignored when the
    element passed as a prop to `<Localized>` is a known void element. This
    prevents the _element is a void element tag and must neither have
    children nor use dangerouslySetInnerHTML_ error in React.

    For instance, `<input>` is a known void element and it must not have the
    text content set by the buggy translation in the following example:

    ```jsx
    <Localized id="hello" text-input={<input type="text" />}>
        <div />
    </Localized>
    ```

    ```properties
    hello = Hello, <text-input>invalid text content</text-input>.
    ```

    Due to this change some build setups might now require the
    `@babel/plugin-proposal-object-rest-spread` or the
    `@babel/plugin-syntax-object-rest-spread` plugin.

  - Support HTML entities in translations. (#183)

    Translations with HTML entities will now trigger the markup sanitization
    logic and will be consequently parsed into the characters they represent.

  - Re-render `withLocalization`-components on l10n changes. (#196)

    Components enhanced by the `withLocalization` are now re-rendered when
    the enclosing `<LocalizationProvider>` receives a new value of the
    `messages` prop.

  - Use compat dependencies only in fluent-react/compat. (#193)

    When `fluent-react` is imported as `fluent-react` it will now use the
    untranspiled version of its `fluent` dependency for consistency. When
    it's imported as `fluent-react/compat` it will use `fluent/compat` too.

    Due to this change some build setups might now require the
    `@babel/plugin-proposal-async-generator-functions` or the
    `@babel/plugin-syntax-async-generators` plugin.

  - Upgrade to Babel 7. (#126)

    `fluent-react/compat` is now built with Babel 7.

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
    be an iterable of `FluentBundle` instances in order of user's preferred
    languages.  This iterable will be used by `Localization` to format
    translations.  If a translation is missing in one language, `Localization`
    will fall back to the next locale.

  - The relevant `FluentBundle` is now cached in `Localized`'s state.

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
