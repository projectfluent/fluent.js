# fluent

`fluent` is a JavaScript implementation of Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.


## Installation

`fluent` can be used both on the client-side and the server-side.  You can
install it from the npm registry or use it as a standalone script (as the
`Fluent` global).

    npm install fluent


## How to use

When you import the `fluent` module it will add the `Intl.MessageContext`
constructor to the global `Intl` object, together with a few other polyfills.
You can consult the complete list of the polyfills in `src/intl/polyfill.js`. 

`Intl.MessageContext` provides the core functionality of formatting
translations from FTL files.

```javascript
require('fluent');

const ctx = new Intl.MessageContext('en-US');

const errors = ctx.addMessages(`
brand-name = Foo 3000
welcome    = Welcome, { $name }, to { brand-name }!
`);

if (errors.length) {
  // syntax errors are per-message and don't break the whole resource
}

const welcome = ctx.messages.get('welcome');

ctx.format(welcome, { name: 'Anna' });
// → 'Welcome, Anna, to Foo 3000!'
```

You can access other API methods by requiring the `fluent` module.  The
currently exposed functions can be found in `src/index.js`.  Keep in mind
that `fluent` is in its 0.x days and that the exposed API may change.


## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.

[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
