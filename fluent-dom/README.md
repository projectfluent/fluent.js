# @fluent/dom ![](https://github.com/projectfluent/fluent.js/workflows/test/badge.svg)

`@fluent/dom` provides the DOM bindings for [Project Fluent][].

[project fluent]: https://projectfluent.org

## Installation

`@fluent/dom` can be used both on the client-side and the server-side. You
can install it from the npm registry or use it as a standalone script (as the
`FluentDOM` global).

    npm install @fluent/dom

## How to use

The `DOMLocalization` constructor provides the core functionality of
full-fallback ready message formatting. It uses a lazy-resolved
`FluentBundle` objects from the `@fluent/bundle` package to format messages.

On top of that, `DOMLocalization` can localize any DOMFragment by
identifying localizable elements with `data-l10n-id` and translating them.

```javascript
import { DOMLocalization } from "@fluent/dom";

const l10n = new DOMLocalization(
  ["/browser/main.ftl", "/toolkit/menu.ftl"],
  generateBundles
);

l10n.connectRoot(document.documentElement);

l10n.translateRoots();

const h1 = document.querySelector("h1");

// Sets `data-l10n-id` and `data-l10n-args` which triggers
// the `MutationObserver` from `DOMLocalization` and translates the
// element.
l10n.setAttributes(h1, "welcome", { user: "Anna" });
```

If your application already has a rendering lifecycle, for example when it's
built with Web Components or a component framework, the `MutationObserver`
used by `DOMLocalization` can become a performance problem as the number of
connected roots grows. The `MiniDOMLocalization` class provides the same DOM
translation API without the observer. Elements are only translated when you
ask for it, typically from the component's render hook, and connected roots are
retranslated when the language changes.

```javascript
import { MiniDOMLocalization } from "@fluent/dom";

const l10n = new MiniDOMLocalization(
  ["/browser/main.ftl", "/toolkit/menu.ftl"],
  generateBundles
);

class MyElement extends HTMLElement {
  connectedCallback() {
    l10n.connectRoot(this.shadowRoot);
  }

  disconnectedCallback() {
    l10n.disconnectRoot(this.shadowRoot);
  }

  render() {
    this.shadowRoot.innerHTML = `<h1 data-l10n-id="welcome"></h1>`;
    // Nothing observes the DOM, so translate explicitly after rendering.
    l10n.translateFragment(this.shadowRoot);
  }
}
```

For imperative uses straight from the JS code, there's also a `Localization`
class that provides just the API needed to format messages in the running code.

```javascript
import { Localization } from "@fluent/dom";

function* generateBundles() {
  // Some lazy logic for yielding FluentBundles.
  yield* [bundle1, bundle2];
}

const l10n = new Localization(
  document,
  ["/browser/main.ftl", "/toolkit/menu.ftl"],
  generateBundles
);

async function main() {
  const msg = await l10n.formatValue("welcome", { name: "Anna" });
  // → 'Welcome, Anna!'
}
```
