import { mapBundleSync } from "fluent-sequence";
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

  formatCompound(bundle, msg, args) {
    const value = bundle.format(msg, args);

    if (msg.attrs) {
      var attrs = {};
      for (const name of Object.keys(msg.attrs)) {
        attrs[name] = bundle.format(msg.attrs[name], args);
      }
    }

    return { value, attrs };
  }

  /*
   * Find a translation by `id` and format it to a string using `args`.
   */
  getString(id, args, fallback) {
    const bundle = this.getBundle(id);

    if (bundle === null) {
      return fallback || id;
    }

    const msg = bundle.getMessage(id);
    return bundle.format(msg, args);
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
