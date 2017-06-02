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
 * In order to pass an iterator to mapContext*, wrap it in CachedIterable.
 * This allows multiple calls to mapContext* without advancing and eventually
 * depleting the iterator.
 *
 *     function *generateMessages() {
 *         // Some lazy logic for yielding MessageContexts.
 *         yield *[ctx1, ctx2];
 *     }
 *
 *     const contexts = new CachedIterable(generateMessages());
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
