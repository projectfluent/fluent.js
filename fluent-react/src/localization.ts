import { FluentBundle, FluentArgument } from "@fluent/bundle";
import { mapBundleSync } from "@fluent/sequence";
import { CachedSyncIterable } from "cached-iterable";
import { createParseMarkup, MarkupParser } from "./markup";

/*
 * `ReactLocalization` handles translation formatting and fallback.
 *
 * The current negotiated fallback chain of languages is stored in the
 * `ReactLocalization` instance in form of an iterable of `FluentBundle`
 * instances. This iterable is used to find the best existing translation for
 * a given identifier.
 *
 * The `ReactLocalization` class instances are exposed to `Localized` elements
 * via the `LocalizationProvider` component.
 */
export class ReactLocalization {
  public bundles: Iterable<FluentBundle>;
  public parseMarkup: MarkupParser | null;

  constructor(
    bundles: Iterable<FluentBundle>,
    parseMarkup: MarkupParser | null = createParseMarkup()
  ) {
    this.bundles = CachedSyncIterable.from(bundles);
    this.parseMarkup = parseMarkup;
  }

  getBundle(id: string): FluentBundle | null {
    return mapBundleSync(this.bundles, id);
  }

  getString(
    id: string,
    args?: Record<string, FluentArgument> | null,
    fallback?: string
  ): string {
    const bundle = this.getBundle(id);
    if (bundle) {
      const msg = bundle.getMessage(id);
      if (msg && msg.value) {
        let errors: Array<Error> = [];
        let value = bundle.formatPattern(msg.value, args, errors);
        for (let error of errors) {
          this.reportError(error);
        }
        return value;
      }
    }

    return fallback || id;
  }

  // XXX Control this via a prop passed to the LocalizationProvider.
  // See https://github.com/projectfluent/fluent.js/issues/411.
  reportError(error: Error): void {
    /* global console */
    // eslint-disable-next-line no-console
    console.warn(`[@fluent/react] ${error.name}: ${error.message}`);
  }
}
