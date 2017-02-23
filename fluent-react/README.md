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


Wrap your localizable elements in `LocalizedElement`:

```javascript
import { LocalizedElement } from 'fluent-react';

<LocalizedElement id="hello-world">
    <p>Hello, world!</p>
</LocalizedElement>
```

The `id` prop should be the unique identifier of the translation.  Any
attributes found in the translation will be applied to the wrapped element.
You can also pass arguments to the translation as `$`-prefixed props on
`LocalizedElement`:

```javascript
<LocalizedElement id="welcome" $username={name}>
    <p>{'Welcome, {$username}'}</p>
</LocalizedElement>
```

It's recommended that the contents of the wrapped component be a string
expression.  It serves no other purpose than to help the developer.  In the
future, it may be used for automatic extraction of source copy.

It's also possible to pass React elements as arguments to translations:

```javascript
<LocalizedElement
    id="welcome"
    $linkA={
        <a href="http://example.com/A">A</a>
    }
    $linkB={
        <LocalizedElement id="link-to-b">
            <a href="http://example.com/B">B</a>
        </LocalizedElement>
    }>
    <p>{'Click { $linkA } or { $linkB}.'}</p>
</LocalizedElement>
```

All `<LocalizedElement> components need access to the central localization
store so they can subscribe to it.  The `<LocalizationProvider>` component
implements the _provider_ pattern known from Redux.  Taking advantage of
React's [context][] feature, it makes the translation store available to all
localized elements in the app without passing it explicitly.

```javascript
import 'fluent-intl-polyfill';
import negotiateLanguages from 'fluent-langneg';
import { LocalizationProvide } from 'fluent-react';

ReactDOM.render(
  <LocalizationProvider
    locale={negotiateLanguages(navigator.language, ['en-US', 'de'])}
    requestMessages={requestMessages}
  >
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
```

`requestMessages` is a function that you have to provide.  It takes a `locale`
code and should return a string with FTL messages. It may be async.

Consult the `examples/` directory for examples of how to change languages or
integrate with Redux.

All of this is very 0.x and is likely to change. See the [wiki][] for more
discussion.

[wiki]: https://github.com/projectfluent/fluent.js/wiki/React-bindings-for-Fluent
[contex]: https://facebook.github.io/react/docs/context.html


## Compatibility

For legacy browsers, the `compat` build has been transpiled using the current
version of Babel's [latest preset][]:

```javascript
import 'fluent-react/compat';
```


## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[latest preset]: https://babeljs.io/docs/plugins/preset-latest/
[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
