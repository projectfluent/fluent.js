# fluent-syntax

`fluent-syntax` is a parser for Fluent translation files, FTL.  Project Fluent
is a localization framework designed to unleash the expressive power of the
natural language.


## Installation

`fluent-syntax` can be used both on the client-side and the server-side.  You
can install it from the npm registry or use it as a standalone script (as the
`FluentSyntax` global).

    npm install fluent-syntax


## How to use

```javascript
import { parse, Resource } from 'fluent-syntax';

const res = parse(`
brand-name = Foo 3000
welcome    = Welcome, { $name }, to { brand-name }!
`);

assert(res instanceof Resource);
```

The API reference is available at
http://projectfluent.org/fluent.js/fluent-syntax.


## Compatibility

For legacy browsers, the `compat` build has been transpiled using Babel's [env
preset][]:

```javascript
import 'fluent-syntax/compat';
```


## Learn more

Find out more about Project Fluent at [projectfluent.org][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[env preset]: https://babeljs.io/docs/plugins/preset-env/
[projectfluent.org]: http://projectfluent.org
[FTL]: http://projectfluent.org/fluent/guide/
