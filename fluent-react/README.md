# @fluent/react ![](https://github.com/projectfluent/fluent.js/workflows/@fluent/react/badge.svg)

`@fluent/react` provides the React bindings for [Project Fluent][].

[Project Fluent]: https://projectfluent.org


## Installation

`@fluent/react` can be used both on the client-side and the server-side. You
can install it from the npm registry or use it as a standalone script (as the
`FluentReact` global).

    npm install @fluent/react


# Integrating with React apps

`@fluent/react` takes advantage of React's Components system and the virtual
DOM. Translations are exposed to components via the _provider_ pattern.

There are many approaches to fetching and storing translations. To allow
maximum flexibility, `@fluent/react` expects the developer to write a little
bit of a setup code related to language negotiation and translation fetching.
It makes `@fluent/react` unopinionated and suitable for many different
scenarios. You will likely also need to install a few other packages:
`@fluent/bundle`, `@fluent/langneg` and `intl-pluralrules`.

Consult the [wiki][] for documentation on how to set up and use
`@fluent/react`.

The API reference is available at https://projectfluent.org/fluent.js/react.

[wiki]: https://github.com/projectfluent/fluent.js/wiki/React-Bindings
