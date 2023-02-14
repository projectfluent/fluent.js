import { FluentBundle } from "@fluent/bundle";

export function mapBundleSync(
  bundles: Iterable<FluentBundle>,
  ids: string
): FluentBundle | null;

export function mapBundleSync(
  bundles: Iterable<FluentBundle>,
  ids: Array<string>
): Array<FluentBundle | null>;

/**
 * Synchronously map an identifier or an array of identifiers to the best
 * `FluentBundle` instance(s).
 *
 * @param bundles - An iterable of bundles to sift through.
 * @param ids - An id or ids to map.
 */
export function mapBundleSync(
  bundles: Iterable<FluentBundle>,
  ids: string | Array<string>
): FluentBundle | null | Array<FluentBundle | null> {
  if (!Array.isArray(ids)) {
    return getBundleForId(bundles, ids);
  }

  return ids.map(id => getBundleForId(bundles, id));
}

/*
 * Find the best `FluentBundle` with the translation for `id`.
 */
function getBundleForId(
  bundles: Iterable<FluentBundle>,
  id: string
): NonNullable<FluentBundle> | null {
  for (const bundle of bundles) {
    if (bundle.hasMessage(id)) {
      return bundle;
    }
  }

  return null;
}
