# fluent-dom

`fluent-dom` provides DOM bindings for Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.

## Installation

`fluent-dom` can be used both on the client-side and the server-side.  You
can install it from the npm registry or use it as a standalone script (as the
`FluentDOM` global).

    npm install fluent-dom


## How to use

The `DocumentLocalization` constructor provides the core functionality of
full-fallback ready message formatting. It uses a lazy-resolved
`MessageContext` objects from the `fluent` package to format messages.

On top of that, DocumentLocalization provides a set of functions needed
for DOM localization.

```javascript
import { DocumentLocalization } from 'fluent-dom'

function *generateMessages() {
  // Some lazy logic for yielding MessageContexts.
  yield *[ctx1, ctx2];
}

const l10n = new DocumentLocalization(document, [
  '/browser/main.ftl',
  '/toolkit/menu.ftl'
], generateMessages);

async function main() {
  const msg = await l10n.formatValue('welcome', { name: 'Anna' });
  // → 'Welcome, Anna!'
}
```

On top of that, DocumentLocalization can localize any DOMFragment by
identifying localizable elements with `l10n-id` and translating them.

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
