# fluent-intl-polyfill

`fluent-intl-polyfill` is a polyfill for some of the [Stage 3+ proposals][] to
the ECMA 402 standard required by the `fluent` package.  Project Fluent is
a localization framework designed to unleash the expressive power of the
natural language.

Currently, the polyfill provides implementations for the following proposals:

  - [Intl.PluralRules][], as implemented by [intl-pluralrules][]


## Installation

`fluent-intl-polyfill` can be used both on the client-side and the server-side.
You can install it from the npm registry or use it as a standalone script.

    npm install fluent-intl-polyfill


## How to use

Simply `import` or `require` the package somewhere in your code.

```javascript
import 'fluent-intl-polyfill';

// Intl.PluralRules is now available.
```


## Learn more

Find out more about Project Fluent at [projectfluent.org][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[Stage 3+ proposals]: https://github.com/tc39/ecma402#current-proposals
[Intl.PluralRules]:https://github.com/tc39/proposal-intl-plural-rules
[intl-pluralrules]: https://www.npmjs.com/package/intl-pluralrules
[projectfluent.org]: http://projectfluent.org
[FTL]: http://projectfluent.org/fluent/guide/
