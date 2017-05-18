# fluent-dom

`fluent-dom` provides DOM bindings for Project Fluent,a localization
framework designed to unleash the expressive power of the natural language.

## Installation

`fluent-dom` can be used both on the client-side and the server-side.  You
can install it from the npm registry or use it as a standalone script (as the
`FluentDOM` global).

    npm install fluent-dom


## How to use

The `Localization` constructor provides the core functionality of 
full-fallback ready message formatting. It uses a lazy-resolved 
`MessageContext` objects from the `fluent` package to format messages.

```javascript
import { Localization } from 'fluent-dom'

const l10n = new Localization('Main', [
  '/browser/main.ftl',
  '/toolkit/menu.ftl'
], generatemessage);

const msg = await l10n.formatValue('welcome', { name: 'Anna' });
// → 'Welcome, Anna!'
```

The `DocumentLocalization` constructor builds on top of the `Localization`
class with functionality related to DOM manipulation. It allows
user to translate the DOM tree using a `Localization` object and set
a `MutationObserver` that will react to changes in l10n-id assignments on
DOM elements.

```javascript

const l10n = new DocumentLocalization(document, [
  '/browser/main.ftl',
  '/toolkit/menu.ftl'
], generatemessage);

l10n.translateDocument();

// Turns on MutationObserver on `document.body`
l10n.connectRoot(document.body);

const h1 = document.querySelector('h1');

// Sets `data-l10n-id` and `data-l10n-args` which triggers
// the `MutationObserver` from `DocumentLocalization` and translates the
// element.
l10n.setAttributes(h1, 'welcome', { user: 'Anna' });
```


## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[README]: ../fluent/README.md
[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
