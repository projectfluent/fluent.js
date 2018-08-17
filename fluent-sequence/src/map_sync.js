/*
 * Synchronously map an identifier or an array of identifiers to the best
 * `MessageContext` instance(s).
 *
 * @param {Iterable} iterable
 * @param {string|Array<string>} ids
 * @returns {MessageContext|Array<MessageContext>}
 */
export default function mapContextSync(iterable, ids) {
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
