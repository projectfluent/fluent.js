/*
 * Asynchronously map an identifier or an array of identifiers to the best
 * `FluentBundle` instance(s).
 *
 * @param {AsyncIterable} iterable
 * @param {string|Array<string>} ids
 * @returns {Promise<FluentBundle|Array<FluentBundle>>}
 */
export default async function mapBundleAsync(iterable, ids) {
  if (!Array.isArray(ids)) {
    for await (const bundle of iterable) {
      if (bundle.hasMessage(ids)) {
        return bundle;
      }
    }
  }

  let remainingCount = ids.length;
  const foundBundles = new Array(remainingCount).fill(null);

  for await (const bundle of iterable) {
    for (const [index, id] of ids.entries()) {
      if (!foundBundles[index] && bundle.hasMessage(id)) {
        foundBundles[index] = bundle;
        remainingCount--;
      }

      // Return early when all ids have been mapped to contexts.
      if (remainingCount === 0) {
        return foundBundles;
      }
    }
  }

  return foundBundles;
}
