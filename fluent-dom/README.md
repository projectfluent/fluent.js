# fluent-dom

`fluent-dom` provides DOM bindings for Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.

## Installation

`fluent-dom` can be used both on the client-side and the server-side.  You
can install it from the npm registry or use it as a standalone script (as the
`FluentDOM` global).

    npm install fluent-dom


## How to use

The `DOMLocalization` constructor provides the core functionality of
full-fallback ready message formatting. It uses a lazy-resolved
`MessageContext` objects from the `fluent` package to format messages.

On top of that, `DOMLocalization` can localize any DOMFragment by
identifying localizable elements with `data-l10n-id` and translating them.

```javascript
import { DOMLocalization } from 'fluent-dom'

const l10n = new DOMLocalization(MutationObserver, [
  '/browser/main.ftl',
  '/toolkit/menu.ftl'
], generateMessages);

l10n.connectRoot(document.documentElement);

l10n.translateDocument();

const h1 = document.querySelector('h1');

// Sets `data-l10n-id` and `data-l10n-args` which triggers
// the `MutationObserver` from `DOMLocalization` and translates the
// element.
l10n.setAttributes(h1, 'welcome', { user: 'Anna' });
```

For imperative uses straight from the JS code, there's also a `Localization`
class that provides just the API needed to format messages in the running code.

```javascript
import { Localization } from 'fluent-dom'

function *generateMessages() {
  // Some lazy logic for yielding MessageContexts.
  yield *[ctx1, ctx2];
}

const l10n = new Localization(document, [
  '/browser/main.ftl',
  '/toolkit/menu.ftl'
], generateMessages);

async function main() {
  const msg = await l10n.formatValue('welcome', { name: 'Anna' });
  // → 'Welcome, Anna!'
}
```

## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
