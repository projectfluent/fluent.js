import { FluentBundle, FluentVariable } from "@fluent/bundle";
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

  areBundlesEmpty(): boolean {
    // Create an iterator and only peek at the first value to see if it contains
    // anything.
    return Boolean(this.bundles[Symbol.iterator]().next().done);
  }

  getString(
    id: string,
    args?: Record<string, FluentVariable> | null,
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
    } else {
      if (this.areBundlesEmpty()) {
        this.reportError(
          new Error(
            "Attempting to get a string when no localization bundles are " +
              "present."
          )
        );
      } else {
        this.reportError(
          new Error(
            `The id "${id}" did not match any messages in the localization `
              + "bundles."
          )
        );
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
