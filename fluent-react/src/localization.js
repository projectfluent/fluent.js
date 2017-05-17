/*
 * The `Localization` class handles formatting of translations and fallback.
 *
 * The current negotiated fallback chain of languages is stored in the
 * `Localization` instance in form of an iterable of `MessageContext`
 * instances.  This iterable is used to find the best existing translation for
 * a given identifier.
 *
 * `Localized` components must subscribe to the changes of the `Localization`'s
 * fallback chain.  When the fallback chain changes (the `messages` iterable is
 * set anew), all subscribed compontent must relocalize.
 *
 * The `Localization` class instances are exposed to `Localized` elements via
 * the `LocalizationProvider` component.
 */
export default class Localization {
  constructor(messages) {
    this.subs = new Set();
    this.contexts = memoize(messages);
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
    this.contexts = memoize(messages);

    // Update all subscribed Localized components.
    this.subs.forEach(comp => comp.relocalize());
  }

  /*
   * Find the best `MessageContext` with the translation for `id`.
   */
  getMessageContext(id) {
    for (const context of this.contexts) {
      if (context.hasMessage(id)) {
        return context;
      }
    }

    return null;
  }
}

/*
 * Create a new iterable which caches the elements yielded by `iterable`.
 *
 * This allows multiple `Localized` components to call `getMessageContext`
 * without advancing and eventually depleting the iterator unless fallback is
 * required.
 */
function memoize(iterable) {
  const iterator = iterable[Symbol.iterator]();
  const seen = [];
  return {
    [Symbol.iterator]() {
      let ptr = 0;
      return {
        next() {
          if (seen.length <= ptr) {
            seen.push(iterator.next());
          }
          return seen[ptr++];
        }
      };
    }
  };
}
