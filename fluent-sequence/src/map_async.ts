import { FluentBundle } from "@fluent/bundle";

export function mapBundleAsync(
  bundles: AsyncIterable<FluentBundle>,
  ids: string
): Promise<FluentBundle | null>;

export function mapBundleAsync(
  bundles: AsyncIterable<FluentBundle>,
  ids: Array<string>
): Promise<Array<FluentBundle | null>>;

/*
 * Asynchronously map an identifier or an array of identifiers to the best
 * `FluentBundle` instance(s).
 *
 * @param bundles - An iterable of bundles to sift through.
 * @param ids - An id or ids to map.
 */
export async function mapBundleAsync(
  bundles: AsyncIterable<FluentBundle>,
  ids: string | Array<string>
): Promise<FluentBundle | null | Array<FluentBundle | null>> {
  if (!Array.isArray(ids)) {
    for await (const bundle of bundles) {
      if (bundle.hasMessage(ids)) {
        return bundle;
      }
    }

    return null;
  }

  const foundBundles = new Array<FluentBundle | null>(ids.length).fill(null);
  let remainingCount = ids.length;

  for await (const bundle of bundles) {
    for (const [index, id] of ids.entries()) {
      if (!foundBundles[index] && bundle.hasMessage(id)) {
        foundBundles[index] = bundle;
        remainingCount--;
      }

      // Return early when all ids have been mapped to bundles.
      if (remainingCount === 0) {
        return foundBundles;
      }
    }
  }

  return foundBundles;
}
