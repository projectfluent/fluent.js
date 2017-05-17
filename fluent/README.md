# fluent

`fluent` is a JavaScript implementation of Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.


## Installation

`fluent` can be used both on the client-side and the server-side.  You can
install it from the npm registry or use it as a standalone script (as the
`Fluent` global).

    npm install fluent


## How to use

The `MessageContext` constructor provides the core functionality of formatting
translations from FTL files.

```javascript
import { MessageContext } from 'fluent';

const ctx = new MessageContext('en-US');

const errors = ctx.addMessages(`
brand-name = Foo 3000
welcome    = Welcome, { $name }, to { brand-name }!
`);

if (errors.length) {
  // syntax errors are per-message and don't break the whole resource
}

const welcome = ctx.getMessage('welcome');

ctx.format(welcome, { name: 'Anna' });
// → 'Welcome, Anna, to Foo 3000!'
```

The API reference is available at http://projectfluent.io/fluent.js/fluent.


## Compatibility

`fluent` requires the following `Intl` formatters:

  - `Intl.DateTimeFormat` (standard, well-supported)
  - `Intl.NumberFormat` (standard, well-supported)
  - `Intl.PluralRules` ([Stage 3 proposal][])

`Intl.PluralRules` may already be available in some engines.  In most cases,
however, a polyfill will be required.  We recommend [fluent-intl-polyfill][]
which uses [intl-pluralrules][].

```javascript
import 'fluent-intl-polyfill';
import { MessageContext } from 'fluent';
```

For legacy browsers, the `compat` build has been transpiled using the current
version of Babel's [latest preset][]:

```javascript
import { MessageContext } from 'fluent/compat';
```


## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[intl-pluralrules]: https://www.npmjs.com/package/intl-pluralrules
[fluent-intl-polyfill]: https://www.npmjs.com/package/fluent-intl-polyfill
[Stage 3 proposal]:https://github.com/tc39/proposal-intl-plural-rules
[latest preset]: https://babeljs.io/docs/plugins/preset-latest/
[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
