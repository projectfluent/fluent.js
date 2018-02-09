# Changelog

## Unreleased

  - Extend formatWithFallback to accept async iterator (#46)
  - Documented all methods
  - Removed `DOMLocalization.prototype.translateRoot` method
  - Simplified initial version of DOM Overlays (to be extended in 0.2) (#71)
      - Only children of the white-listed types are allowed now. It's not possible
        anymore to put elements of other types in the source HTML to make exceptions.
      - The identity of the source element's children is explicitly not kept
        anymore. This allows us to treat the translation DocumentFragment as the
        reference for iteration over child nodes.
      - The overlay function is also no longer recursive. Any nested HTML
        will be lost and only its textContent will be preserved.
  - Added `data-l10n-attrs` to allow for whitelisting localizable attributes (#70)
  - Added a guard to prevent registering nested roots (#72)
  - Added a guard to prevent leaking attributes between translations (#73)
  - Added a performance optimization coalescing all translations from mutations
  per animation frame (#113)
  - …

## fluent-dom 0.0.1

  - Introduce Fluent bindings for DOM.

    The initial release.
