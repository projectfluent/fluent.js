# @fluent/bundle ![](https://github.com/projectfluent/fluent.js/workflows/test/badge.svg)

`@fluent/bundle` is a JavaScript implementation of [Project Fluent][],
optimized for runtime performance.

[project fluent]: https://projectfluent.org

## Installation

`@fluent/bundle` can be used both on the client-side and the server-side. You
can install it from the npm registry or use it as a standalone script (as the
`FluentBundle` global).

    npm install @fluent/bundle

## How to use

The `FluentBundle` constructor provides the core functionality of formatting
translations from FTL files.

```javascript
import { FluentBundle, FluentResource } from "@fluent/bundle";

let resource = new FluentResource(`
-brand-name = Foo 3000
welcome = Welcome, {$name}, to {-brand-name}!
`);

let bundle = new FluentBundle("en-US");
let errors = bundle.addResource(resource);
if (errors.length) {
  // Syntax errors are per-message and don't break the whole resource
}

let welcome = bundle.getMessage("welcome");
if (welcome.value) {
  bundle.formatPattern(welcome.value, { name: "Anna" });
  // → "Welcome, Anna, to Foo 3000!"
}
```

The API reference is available at https://projectfluent.org/fluent.js/bundle.

## Compatibility

`@fluent/bundle` requires the following `Intl` formatters:

- `Intl.DateTimeFormat` (standard, well-supported)
- `Intl.NumberFormat` (standard, well-supported)
- `Intl.PluralRules` (standard, new in ECMAScript 2018)

`Intl.PluralRules` may already be available in some engines. In most cases,
however, a polyfill will be required. We recommend [intl-pluralrules][].

```javascript
import "intl-pluralrules";
import { FluentBundle } from "@fluent/bundle";
```

See also the [Compatibility][] article on the `fluent.js` wiki.

[intl-pluralrules]: https://www.npmjs.com/package/intl-pluralrules
[compatibility]: https://github.com/projectfluent/fluent.js/wiki/Compatibility
