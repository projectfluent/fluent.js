import { mapBundleSync } from "@fluent/sequence";
import { CachedSyncIterable } from "cached-iterable";

/*
 * `ReactLocalization` handles translation formatting and fallback.
 *
 * The current negotiated fallback chain of languages is stored in the
 * `ReactLocalization` instance in form of an iterable of `FluentBundle`
 * instances.  This iterable is used to find the best existing translation for
 * a given identifier.
 *
 * `Localized` components must subscribe to the changes of the
 * `ReactLocalization`'s fallback chain.  When the fallback chain changes (the
 * `bundles` iterable is set anew), all subscribed compontent must relocalize.
 *
 * The `ReactLocalization` class instances are exposed to `Localized` elements
 * via the `LocalizationProvider` component.
 */
export default class ReactLocalization {
  constructor(bundles) {
    this.bundles = CachedSyncIterable.from(bundles);
    this.subs = new Set();
  }

  /*
   * Subscribe a `Localized` component to changes of `bundles`.
   */
  subscribe(comp) {
    this.subs.add(comp);
  }

  /*
   * Unsubscribe a `Localized` component from `bundles` changes.
   */
  unsubscribe(comp) {
    this.subs.delete(comp);
  }

  /*
   * Set a new `bundles` iterable and trigger the retranslation.
   */
  setBundles(bundles) {
    this.bundles = CachedSyncIterable.from(bundles);

    // Update all subscribed Localized components.
    this.subs.forEach(comp => comp.relocalize());
  }

  getBundle(id) {
    return mapBundleSync(this.bundles, id);
  }

  /*
   * Find a translation by `id` and format it to a string using `args`.
   */
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

export function isReactLocalization(props, propName) {
  const prop = props[propName];

  if (prop instanceof ReactLocalization) {
    return null;
  }

  return new Error(
    `The ${propName} context field must be an instance of ReactLocalization.`
  );
}
