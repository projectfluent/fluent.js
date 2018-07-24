import { mapContextSync } from "fluent";
import { CachedSyncIterable } from "cached-iterable";

/*
 * `ReactLocalization` handles translation formatting and fallback.
 *
 * The current negotiated fallback chain of languages is stored in the
 * `ReactLocalization` instance in form of an iterable of `MessageContext`
 * instances.  This iterable is used to find the best existing translation for
 * a given identifier.
 *
 * `Localized` components must subscribe to the changes of the
 * `ReactLocalization`'s fallback chain.  When the fallback chain changes (the
 * `messages` iterable is set anew), all subscribed compontent must relocalize.
 *
 * The `ReactLocalization` class instances are exposed to `Localized` elements
 * via the `LocalizationProvider` component.
 */
export default class ReactLocalization {
  constructor(messages) {
    this.contexts = CachedSyncIterable.from(messages);
    this.subs = new Set();
  }

  /*
   * Subscribe a `Localized` component to changes of `messages`.
   */
  subscribe(comp) {
    this.subs.add(comp);
  }

  /*
   * Unsubscribe a `Localized` component from `messages` changes.
   */
  unsubscribe(comp) {
    this.subs.delete(comp);
  }

  /*
   * Set a new `messages` iterable and trigger the retranslation.
   */
  setMessages(messages) {
    this.contexts = CachedSyncIterable.from(messages);

    // Update all subscribed Localized components.
    this.subs.forEach(comp => comp.relocalize());
  }

  getMessageContext(id) {
    return mapContextSync(this.contexts, id);
  }

  formatCompound(mcx, msg, args) {
    const value = mcx.format(msg, args);

    if (msg.attrs) {
      var attrs = {};
      for (const name of Object.keys(msg.attrs)) {
        attrs[name] = mcx.format(msg.attrs[name], args);
      }
    }

    return { value, attrs };
  }

  /*
   * Find a translation by `id` and format it to a string using `args`.
   */
  getString(id, args, fallback) {
    const mcx = this.getMessageContext(id);

    if (mcx === null) {
      return fallback || id;
    }

    const msg = mcx.getMessage(id);
    return mcx.format(msg, args);
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
