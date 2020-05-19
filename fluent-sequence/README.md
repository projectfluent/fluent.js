# @fluent/sequence ![](https://github.com/projectfluent/fluent.js/workflows/.github/workflows/fluent-sequence.yml/badge.svg)

`@fluent/sequence` provides mapping functions from string identifiers to
`FluentBundle` instances taken from synchronous or asynchronous sequences.
It's part of Project Fluent, a localization framework designed to unleash the
expressive power of the natural language.


## Installation

`@fluent/sequence` can be used both on the client-side and the server-side.
You can install it from the npm registry or use it as a standalone script (as
the `FluentSequence` global).

    npm install @fluent/sequence


## How to use

An ordered iterable of `FluentBundle` instances can represent the current
negotiated fallback chain of languages. This iterable can be used to find the
best existing translation for a given identifier.

`@fluent/sequence` provides two mapping functions: `mapBundleSync`, and
`mapBundleAsync`. They can be used to find the first `FluentBundle` in the
given iterable which contains the translation with the given identifier. If
the iterable is ordered according to the result of a language negotiation the
returned `FluentBundle` contains the best available translation.

A simple function which formats translations based on the identifier might
be implemented as follows:

```js
import {mapBundleSync} from "@fluent/sequence";

function formatString(id, args) {
    // contexts is a negotiated iterable of FluentBundle instances.
    let ctx = mapBundleSync(contexts, id);

    if (ctx === null) {
        return id;
    }

    let msg = ctx.getMessage(id);
    return ctx.format(msg, args);
}
```

When passing a synchronous iterator to `mapBundleSync`, wrap it in
`CachedSyncIterable` from the [`cached-iterable`][] package. When passing an
asynchronous iterator to `mapBundleAsync`, wrap it in `CachedAsyncIterable`.
This allows multiple calls to `mapContext*` without advancing and eventually
depleting the iterator.

The API reference is available at
https://projectfluent.org/fluent.js/sequence.

[`cached-iterable`]: https://www.npmjs.com/package/cached-iterable


## Learn more

Find out more about Project Fluent at [projectfluent.org][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.

[projectfluent.org]: https://projectfluent.org
[FTL]: https://projectfluent.org/fluent/guide/
