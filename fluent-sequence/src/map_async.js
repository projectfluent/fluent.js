/*
 * Asynchronously map an identifier or an array of identifiers to the best
 * `MessageContext` instance(s).
 *
 * @param {AsyncIterable} iterable
 * @param {string|Array<string>} ids
 * @returns {Promise<MessageContext|Array<MessageContext>>}
 */
export default async function mapContextAsync(iterable, ids) {
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
    for (const [index, id] of ids.entries()) {
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
