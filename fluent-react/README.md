# fluent-react

`fluent-react` provides React bindings for Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.


## Installation

`fluent-react` can be used both on the client-side and the server-side.  You
can install it from the npm registry or use it as a standalone script (as the
`FluentReact` global).

    npm install fluent-react


# Integrating with React apps

`fluent-react` takes advantage of React's Components system and the virtual
DOM.  Translations are exposed to components via the _provider_ pattern.

There are many approaches to fetching and storing translations.  To allow
maximum flexibility, `fluent-react` expects the developer to write a little bit
of a setup code related to language negotiation and translation fetching.  It
makes `fluent-react` unopinionated and suitable for many different scenarios.
You will likely also need to install a few other packages: `fluent`,
`fluent-langneg` and `fluent-intl-polyfill`.

Consult the [wiki][] for documentation on how to set up and use `fluent-react`.

[wiki]: https://github.com/projectfluent/fluent.js/wiki/React-Bindings


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
