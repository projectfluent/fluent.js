# Changelog

## Unreleased

  - Drop support for IE and old evergreen browsers. (#133)

    Currently supported are: Firefox 52+, Chrome 55+, Edge 15+, Safari 10.1+,
    iOS Safari 10.3+ and node 8.9+.

  - Add the `cached-iterable` runtime dependency.

    `CachedAsyncIterable` is now available from its own package rather than
    from the `fluent` package.

## fluent-dom 0.3.0

  - Refactor the overlay sanitization methods into separate functions. (#189)
  - Separate out CachedIterable and CachedAsyncIterable, and add a param to touchNext. (#191)
  - Localization.formatValues should accept an array of objects. (#198)
  - Allow adding and removing resource Ids from a Localization. (#197)

## fluent-dom 0.2.0

  - DOM Overlays v2 (#168)
    Major refactor of DOM Overlays allowing developers to provide node elements as attributes.
  - Refactored error reporting (#160)
  - Fixed a minor bug which caused an extranous retranslation when `data-l10n-id` was
    being removed from an element.

## fluent-dom 0.1.0

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

## fluent-dom 0.0.1

  - Introduce Fluent bindings for DOM.

    The initial release.
