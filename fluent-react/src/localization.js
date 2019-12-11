import { mapBundleSync } from "@fluent/sequence";
import { CachedSyncIterable } from "cached-iterable";

/*
 * `ReactLocalization` handles translation formatting and fallback.
 *
 * The current negotiated fallback chain of languages is stored in the
 * `ReactLocalization` instance in form of an iterable of `FluentBundle`
 * instances. This iterable is used to find the best existing translation for
 * a given identifier.
 *
 * The `ReactLocalization` class instances are exposed to `Localized` elements
 * via the `LocalizationProvider` component.
 */
export default class ReactLocalization {
  constructor(bundles) {
    this.bundles = CachedSyncIterable.from(bundles);
  }

  getBundle = id => mapBundleSync(this.bundles, id);

  getString(id, args, fallback) {
    const bundle = this.getBundle(id);

    if (bundle) {
      const msg = bundle.getMessage(id);
      if (msg && msg.value) {
        let errors = [];
        let value = bundle.formatPattern(msg.value, args, errors);
        for (let error of errors) {
          this.reportError(error);
        }
        return value;
      }
    }

    return fallback || id;
  }

  // XXX Control this via a prop passed to the LocalizationProvider.
  // See https://github.com/projectfluent/fluent.js/issues/411.
  reportError(error) {
    /* global console */
    // eslint-disable-next-line no-console
    console.warn(`[@fluent/react] ${error.name}: ${error.message}`);
  }
}
