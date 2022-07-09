import { FluentBundle, FluentVariable } from "@fluent/bundle";
import { mapBundleSync } from "@fluent/sequence";
import { Fragment, ReactElement, createElement, isValidElement, ReactFragment, cloneElement } from "react";
import { CachedSyncIterable } from "cached-iterable";
import { createParseMarkup, MarkupParser } from "./markup.js";
import voidElementTags from "../vendor/voidElementTags.js";

// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reMarkup = /<|&#?\w+;/;

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
            `The id "${id}" did not match any messages in the localization ` +
              "bundles."
          )
        );
      }
    }

    return fallback || id;
  }

  getFragment(
    id: string,
    args?: {
      vars?: Record<string, FluentVariable>,
      elems?: Record<string, ReactElement>,
    },
    fallback?: string
  ): ReactFragment {
    const bundle = this.getBundle(id);
    if (!bundle) {
      if (this.areBundlesEmpty()) {
        this.reportError(
          new Error(
            "Attempting to get a fragment when no localization bundles are " +
              "present."
          )
        );
      } else {
        this.reportError(
          new Error(
            `The id "${id}" did not match any messages in the localization ` +
              "bundles."
          )
        );
      }
      return createElement(Fragment, null, fallback || id);
    }

    const msg = bundle.getMessage(id);

    if (!msg || !msg.value) {
      return createElement(Fragment, null, fallback || id);
    }

    let errors: Array<Error> = [];
    let value = bundle.formatPattern(msg.value, args && args.vars ? args.vars : {}, errors);
    for (let error of errors) {
      this.reportError(error);
    }

    let elemsLower: Record<string, ReactElement>;
    if (args && args.elems) {
      elemsLower = {};
      for (let [name, elem] of Object.entries(args.elems)) {
        elemsLower[name.toLowerCase()] = elem;
      }
    }

    // If the message value doesn't contain any markup nor any HTML entities,
    // return a fragment with the message directly.
    if (!reMarkup.test(value) || this.parseMarkup === null) {
      return createElement(Fragment, null, value);
    }

    // If the message contains markup, parse it and try to match the children
    // found in the translation with the elems passed to this method.
    const translationNodes = this.parseMarkup(value);
    const translatedChildren = translationNodes.map(childNode => {
      if (childNode.nodeName === "#text") {
        return childNode.textContent;
      }

      const childName = childNode.nodeName.toLowerCase();

      // If the child is not expected just take its textContent.
      if (
        !elemsLower ||
        !Object.prototype.hasOwnProperty.call(elemsLower, childName)
      ) {
        return childNode.textContent;
      }

      const sourceChild = elemsLower[childName];

      // Ignore elems which are not valid React elements.
      if (!isValidElement(sourceChild)) {
        return childNode.textContent;
      }

      // If the element passed in the elems prop is a known void element,
      // explicitly dismiss any textContent which might have accidentally been
      // defined in the translation to prevent the "void element tags must not
      // have children" error.
      if (
        typeof sourceChild.type === "string" &&
        sourceChild.type in voidElementTags
      ) {
        return sourceChild;
      }

      return cloneElement(sourceChild, undefined, childNode.textContent);
    });
    return createElement(Fragment, null, ...translatedChildren);
  }

  // XXX Control this via a prop passed to the LocalizationProvider.
  // See https://github.com/projectfluent/fluent.js/issues/411.
  reportError(error: Error): void {
    /* global console */
    // eslint-disable-next-line no-console
    console.warn(`[@fluent/react] ${error.name}: ${error.message}`);
  }
}
