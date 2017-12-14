# fluent-langneg

`fluent-langneg` is an API for negotiating languages. It's part of
Project Fluent, a localization framework designed to unleash 
the expressive power of the natural language.

## Installation

`fluent-langneg` can be used both on the client-side and the server-side.
You can install it from the npm registry or use it as a standalone script.

    npm install fluent-langneg


## How to use

```javascript
import { negotiateLanguages } from 'fluent-langneg';

const supportedLocales = negotiateLanguages(
  navigator.languages,       // requested locales
  ['de', 'en-US', 'pl'],     // available locales
  { defaultLocale: 'en-US' }
);
```

The API reference is available at
http://projectfluent.org/fluent.js/fluent-langneg.

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
the application supportes `en-GB` and `en-US`.

Unicode CLDR maintains a complete list of likely subtags that the
user can load into `fluent-langneg` to replace the minimal version.

```javascript
let data = require('cldr-core/supplemental/likelySubtags.json');

let supported = negotiateLanguages(requested, available, {
  likelySubtags: data.supplemental.likelySubtags
});
```

## Learn more

Find out more about Project Fluent at [projectfluent.org][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[projectfluent.org]: http://projectfluent.org
[FTL]: http://projectfluent.org/fluent/guide/
