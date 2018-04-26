/*
 * @overview
 *
 * Functions for managing ordered sequences of MessageContexts.
 *
 * An ordered iterable of MessageContext instances can represent the current
 * negotiated fallback chain of languages.  This iterable can be used to find
 * the best existing translation for a given identifier.
 *
 * The mapContext* methods can be used to find the first MessageContext in the
 * given iterable which contains the translation with the given identifier.  If
 * the iterable is ordered according to the result of a language negotiation
 * the returned MessageContext contains the best available translation.
 *
 * A simple function which formats translations based on the identifier might
 * be implemented as follows:
 *
 *     formatString(id, args) {
 *         const ctx = mapContextSync(contexts, id);
 *
 *         if (ctx === null) {
 *             return id;
 *         }
 *
 *         const msg = ctx.getMessage(id);
 *         return ctx.format(msg, args);
 *     }
 *
 * In order to pass an iterator to mapContext*, wrap it in
 * Cached{Sync|Async}Iterable.
 * This allows multiple calls to mapContext* without advancing and eventually
 * depleting the iterator.
 *
 *     function *generateMessages() {
 *         // Some lazy logic for yielding MessageContexts.
 *         yield *[ctx1, ctx2];
 *     }
 *
 *     const contexts = new CachedSyncIterable(generateMessages());
 *     const ctx = mapContextSync(contexts, id);
 *
 */

/*
 * Synchronously map an identifier or an array of identifiers to the best
 * `MessageContext` instance(s).
 *
 * @param {Iterable} iterable
 * @param {string|Array<string>} ids
 * @returns {MessageContext|Array<MessageContext>}
 */
export function mapContextSync(iterable, ids) {
  if (!Array.isArray(ids)) {
    return getContextForId(iterable, ids);
  }

  return ids.map(
    id => getContextForId(iterable, id)
  );
}

/*
 * Find the best `MessageContext` with the translation for `id`.
 */
function getContextForId(iterable, id) {
  for (const context of iterable) {
    if (context.hasMessage(id)) {
      return context;
    }
  }

  return null;
}

/*
 * Asynchronously map an identifier or an array of identifiers to the best
 * `MessageContext` instance(s).
 *
 * @param {AsyncIterable} iterable
 * @param {string|Array<string>} ids
 * @returns {Promise<MessageContext|Array<MessageContext>>}
 */
export async function mapContextAsync(iterable, ids) {
  if (!Array.isArray(ids)) {
    for await (const context of iterable) {
      if (context.hasMessage(ids)) {
        return context;
      }
    }
  }

  let remainingCount = ids.length;
  const foundContexts = new Array(remainingCount).fill(null);

  for await (const context of iterable) {
    // XXX Switch to const [index, id] of id.entries() when we move to Babel 7.
    // See https://github.com/babel/babel/issues/5880.
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      if (!foundContexts[index] && context.hasMessage(id)) {
        foundContexts[index] = context;
        remainingCount--;
      }

      // Return early when all ids have been mapped to contexts.
      if (remainingCount === 0) {
        return foundContexts;
      }
    }
  }

  return foundContexts;
}
