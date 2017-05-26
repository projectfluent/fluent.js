/*
 * MessageSyncSequence manages an ordered sequence of MessageContexts.
 *
 * The current negotiated fallback chain of languages is stored in form of an
 * iterable of MessageContext instances.  This iterable is used to find the
 * best existing translation for a given identifier.
 *
 *     const seq = new MessageSyncSequence();
 *     seq.setIterable([ctx1, ctx2]);
 *
 * Use the mapContext method to find the first MessageContext which
 * contains the translation with the given identifier.  If the sequence
 * is ordered according to the result of a language negotiation the returned
 * MessageContext contains the best available translation.
 *
 * A simple function which formats translations based on the identifier might
 * be implemented as follows:
 *
 *     formatString(id, args) {
 *         const ctx = seq.mapContext(id);
 *
 *         if (ctx === null) {
 *             return id;
 *         }
 *
 *         const msg = ctx.getMessage(id);
 *         return ctx.format(msg, args);
 *     }
 *
 * The iterable passed to MessageSyncSequence.setIterable can also be an
 * iterator.  The elements it yields will be cached by the MessageSyncSequence.
 * This allows multiple calls to mapContext without advancing and eventually
 * depleting the iterator.
 *
 *     function *generateMessages() {
 *         // Some lazy logic for yielding MessageContexts.
 *         yield *[ctx1, ctx2];
 *     }
 *
 *     const seq = new MessageSyncSequence();
 *     seq.setIterable(generateMessages());
 *
 */
export class MessageSyncSequence {
  /*
   * Set a new `messages` iterable.
   */
  setIterable(messages) {
    if (Symbol.iterator in Object(messages)) {
      this.contexts = memoize(messages);
    } else {
      throw new TypeError('Argument must implement the iteration protocol.');
    }
  }

  /*
   * Find the best `MessageContext` with the translation for `id`.
   */
  mapContext(id) {
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
