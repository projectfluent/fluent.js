# @fluent/langneg ![](https://github.com/projectfluent/fluent.js/workflows/@fluent/langneg/badge.svg)

`@fluent/langneg` provides an API for negotiating languages. It's part of
[Project Fluent][]. Its main function is to provide functionality around the
[Intl.Locale][] API with a focus on language negotiation, matching and
selection.

[Project Fluent]: https://projectfluent.org
[Intl.Locale]: https://github.com/tc39/proposal-intl-locale


## Installation

`@fluent/langneg` can be used both on the client-side and the server-side.
You can install it from the npm registry or use it as a standalone script.

    npm install @fluent/langneg


## How to use

```javascript
import { negotiateLanguages } from '@fluent/langneg';

const supportedLocales = negotiateLanguages(
  navigator.languages,       // requested locales
  ['de', 'en-US', 'pl'],     // available locales
  { defaultLocale: 'en-US' }
);
```

The API reference is available at
https://projectfluent.org/fluent.js/langneg.

## Strategies

The API supports three negotiation strategies:

### filtering (default)

In this strategy the algorithm will look for the best matching available
locale for each requested locale.

Example:

requested: ['de-DE', 'fr-FR']
available: ['it', 'de', 'en-US', 'fr-CA', 'de-DE', 'fr', 'de-AU']

supported: ['de-DE', 'fr']

### matching

In this strategy the algorithm will try to match as many available locales
as possible for each of the requested locale.

Example:

requested: ['de-DE', 'fr-FR']
available: ['it', 'de', 'en-US', 'fr-CA', 'de-DE', 'fr', 'de-AU']

supported: ['de-DE', 'de', 'fr', 'fr-CA']

### lookup

In this strategy the algorithm will try to find the single best locale
for the requested locale list among the available locales.

Example:

requested: ['de-DE', 'fr-FR']
available: ['it', 'de', 'en-US', 'fr-CA', 'de-DE', 'fr', 'de-AU']

supported: ['de-DE']

### API use:

```javascript
let supported = negotiateLanguages(requested, available, {
  strategy: 'matching',
});
```

## Likely subtags

Fluent Language Negotiation module carries its own minimal list of likely
subtags data, which is useful in finding most likely available locales
in case the requested locale is too generic.

An example of that scenario is when the user requests `en` locale, and
the application supports `en-GB` and `en-US`.
