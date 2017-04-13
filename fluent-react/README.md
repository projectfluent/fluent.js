# fluent-react

`fluent-react` provides React bindings for Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.


## Installation

`fluent-react` can be used both on the client-side and the server-side.  You
can install it from the npm registry or use it as a standalone script (as the
`FluentReact` global).

    npm install fluent-react


## How to use

`fluent-react` takes advantage of React's Components system and the virtual
DOM.  Translations are stored using the Fluent syntax ([FTL][]) and exposed to
components via the _provider_ pattern.

An example FTL file might look like the following:

```
hello-world = Hello, world!
welcome = Welcome, { $username }.
```


Wrap your localizable elements in the `Localized` component:

```javascript
import { Localized } from 'fluent-react';

<Localized id="hello-world">
    <p>Hello, world!</p>
</Localized>
```

The `id` prop should be the unique identifier of the translation.  Any
attributes found in the translation will be applied to the wrapped element.
You can also pass arguments to the translation as `$`-prefixed props on
`Localized`:

```javascript
<Localized id="welcome" $username={name}>
    <p>{'Welcome, {$username}'}</p>
</Localized>
```

It's recommended that the contents of the wrapped component be a string
expression.  The string will be used as the ultimate fallback if no translation
is available.  It also makes it easy to grep for strings in the source code.
In the future, it may be used for automatic extraction of source copy.

It's also possible to pass React elements as arguments to translations:

```javascript
<Localized
    id="welcome"
    $linkA={
        <a href="http://example.com/A">A</a>
    }
    $linkB={
        <Localized id="link-to-b">
            <a href="http://example.com/B">B</a>
        </Localized>
    }>
    <p>{'Click { $linkA } or { $linkB}.'}</p>
</Localized>
```

All `<Localized>` components need access to an instance of the `Localization`
class, the central localization store to which they subscribe.  The
`<LocalizationProvider>` component implements the _provider_ pattern known from
Redux.  Taking advantage of React's [context][] feature, it makes translations
available to all localized elements in the app without passing them explicitly.

```javascript
ReactDOM.render(
    <LocalizationProvider messages={…}>
        …
    </LocalizationProvider>,
    document.getElementById('root')
);
```

The `LocalizationProvider` component takes one prop: `messages`.  It should be
an iterable of `MessageContext` instances in order of the user's preferred
languages.  The `MessageContext` instances will be used by `Localization` to
format translations.  If a translation is missing in one instance,
`Localization` will fall back to the next one.

In its simplest form, `messages` can be an array:

```javascript
function generateMessages(currentLocales) {
    return currentLocales.map(locale => {
        const cx = new MessageContext(locale);
        cx.addMessages(MESSAGES_ALL[locale]);
        return cx;
    });
}

<LocalizationProvider messages={generateMessages(['en-US'])}>
    …
</LocalizationProvider>,
```

In order to avoid having to create all `MessageContext` instances for all
locales up front, it's a good idea to make `messages` an iterator.  The
`Localization` class will iterate over it (memoizing the items it yields) in
case fallback is required.

```javascript
export function* generateMessages(currentLocales) {
    for (const locale of currentLocales) {
        const cx = new MessageContext(locale);
        cx.addMessages(MESSAGES_ALL[locale]);
        yield cx;
    }
}

<LocalizationProvider messages={generateMessages(['en-US'])}>
    …
</LocalizationProvider>,
```

[context]: https://facebook.github.io/react/docs/context.html


## The messages iterable

The design of the `LocalizationProvider` requires a little bit of work from the
developer.  The `messages` iterable needs to be created manually.  This is
intentional: it gives the most control to the developer with regards to the
following three areas:

 - translations - the developer decides where translations are stored and
   how they're fetched,
 - language negotiation - the developer decides whhich factors are taken into
   account for the purpose of the language negotiation, as well as how exactly
   it's being done (we recommend [fluent-langneg][]),
 - custom extensions - the developer can pass options to the `MessageContext`
   constructor to configure its bahavior or to define functions available to
   translations.

In the future we might end up providing ready-made generators of the `messages`
iterable for the most common scenarios.

One limitation of the current design is that in asynchronous scenarios, all
translations (including any fallback) must be fetched at once before
`<LocalizationProvider>` is rendered.  See the `*-async` examples in the
`examples/` directory for more information.

In the future we might be able to allow async fetching of fallback locales.

[fluent-langneg]: https://github.com/projectfluent/fluent.js/tree/master/fluent-langneg


## A complete example

```javascript
import 'fluent-intl-polyfill';
import negotiateLanguages from 'fluent-langneg';
import { MessageContext } from 'fluent';
import { LocalizationProvider } from 'fluent-react';

const MESSAGES_ALL = {
    'fr': 'title = Salut le monde !',
    'en-US': 'title = Hello, world!',
    'pl': 'title = Witaj świecie!'
};

export function* generateMessages(userLocales) {
    // Choose locales that are best for the user.
    const currentLocales = negotiateLanguages(
        userLocales,
        ['fr', 'en-US', 'pl'],
        { defaultLocale: 'en-US' }
    );

    for (const locale of currentLocales) {
        const cx = new MessageContext(locale);
        cx.addMessages(MESSAGES_ALL[locale]);
        yield cx;
    }
}

ReactDOM.render(
    <LocalizationProvider messages={generateMessages(navigator.languages)}>
        <App />
    </LocalizationProvider>,
    document.getElementById('root')
);
```

Consult the `examples/` directory for examples of how to fetch translations
asynchronously, change languages or integrate with Redux.

All of this is very 0.x and is likely to change. See the [wiki][] for more
discussion.

[wiki]: https://github.com/projectfluent/fluent.js/wiki/React-bindings-for-Fluent


## Compatibility

For legacy browsers, the `compat` build has been transpiled using the current
version of Babel's [latest preset][]:

```javascript
import 'fluent-react/compat';
```

In some cases, using the `compat` build may be needed even if you target modern
browsers.  For instance, the `create-react-app` boilerplate uses UglifyJS to
minify its files.  As of April 2017, UglifyJS doesn't support some of the new
JavaScript syntax features.  By using the `compat` build of all `fluent`
packages you can ensure that the minifiction works properly.


## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[latest preset]: https://babeljs.io/docs/plugins/preset-latest/
[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
