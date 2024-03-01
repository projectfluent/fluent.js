import { FluentBundle, FluentVariable } from "@fluent/bundle";
import { mapBundleSync } from "@fluent/sequence";
import {
  Fragment,
  ReactElement,
  createElement,
  isValidElement,
  cloneElement,
  ReactNode,
} from "react";
import { CachedSyncIterable } from "cached-iterable";
import { createParseMarkup, MarkupParser } from "./markup.js";
import voidElementTags from "../vendor/voidElementTags.js";

// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reMarkup = /<|&#?\w+;/;

const defaultReportError = (error: Error): void => {
  /* global console */
  // eslint-disable-next-line no-console
  console.warn(`[@fluent/react] ${error.name}: ${error.message}`);
};

/**
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
  public reportError: (error: Error) => void;

  constructor(
    bundles: Iterable<FluentBundle>,
    parseMarkup: MarkupParser | null = createParseMarkup(),
    reportError?: (error: Error) => void
  ) {
    this.bundles = CachedSyncIterable.from(bundles);
    this.parseMarkup = parseMarkup;
    this.reportError = reportError || defaultReportError;
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
    vars?: Record<string, FluentVariable> | null,
    fallback?: string
  ): string {
    const bundle = this.getBundle(id);
    if (bundle) {
      const msg = bundle.getMessage(id);
      if (msg && msg.value) {
        let errors: Array<Error> = [];
        let value = bundle.formatPattern(msg.value, vars, errors);
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

  getElement(
    sourceElement: ReactElement,
    id: string,
    args: {
      vars?: Record<string, FluentVariable>;
      elems?: Record<string, ReactElement>;
      attrs?: Record<string, boolean>;
      nestedElems?: boolean;
    } = {}
  ): ReactElement {
    const bundle = this.getBundle(id);
    if (bundle === null) {
      if (!id) {
        this.reportError(
          new Error("No string id was provided when localizing a component.")
        );
      } else if (this.areBundlesEmpty()) {
        this.reportError(
          new Error(
            "Attempting to get a localized element when no localization bundles are " +
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

      return createElement(Fragment, null, sourceElement);
    }

    // this.getBundle makes the bundle.hasMessage check which ensures that
    // bundle.getMessage returns an existing message.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const msg = bundle.getMessage(id)!;

    let errors: Array<Error> = [];

    let localizedProps: Record<string, string> | undefined;
    // The default is to forbid all message attributes. If the attrs prop exists
    // on the Localized instance, only set message attributes which have been
    // explicitly allowed by the developer.
    if (args.attrs && msg.attributes) {
      localizedProps = {};
      errors = [];
      for (const [name, allowed] of Object.entries(args.attrs)) {
        if (allowed && name in msg.attributes) {
          localizedProps[name] = bundle.formatPattern(
            msg.attributes[name],
            args.vars,
            errors
          );
        }
      }
      for (let error of errors) {
        this.reportError(error);
      }
    }

    // If the component to render is a known void element, explicitly dismiss the
    // message value and do not pass it to cloneElement in order to avoid the
    // "void element tags must neither have `children` nor use
    // `dangerouslySetInnerHTML`" error.
    if (
      typeof sourceElement.type === "string" &&
      sourceElement.type in voidElementTags
    ) {
      return cloneElement(sourceElement, localizedProps);
    }

    // If the message has a null value, we're only interested in its attributes.
    // Do not pass the null value to cloneElement as it would nuke all children
    // of the wrapped component.
    if (msg.value === null) {
      return cloneElement(sourceElement, localizedProps);
    }

    errors = [];
    const messageValue = bundle.formatPattern(msg.value, args.vars, errors);
    for (let error of errors) {
      this.reportError(error);
    }

    // If the message value doesn't contain any markup nor any HTML entities,
    // insert it as the only child of the component to render.
    if (!reMarkup.test(messageValue) || this.parseMarkup === null) {
      return cloneElement(sourceElement, localizedProps, messageValue);
    }

    const elemsLower: Map<string, ReactElement> = new Map();
    if (args.elems) {
      for (let [name, elem] of Object.entries(args.elems)) {
        // Ignore elems which are not valid React elements.
        if (!isValidElement(elem)) {
          continue;
        }
        elemsLower.set(name.toLowerCase(), elem);
      }
    }

    // If the message contains markup, parse it and try to match the children
    // found in the translation with the args passed to this function.
    const translationNodes = this.parseMarkup(messageValue);
    const translatedChildren = translateChildren(
      translationNodes,
      elemsLower,
      args.nestedElems
    );

    return cloneElement(sourceElement, localizedProps, ...translatedChildren);
  }
}

function translateChildren(
  translationNodes: Node[],
  elemsLower: Map<string, ReactElement>,
  recursive: boolean | undefined
): ReactNode[] {
  return translationNodes.map(({ nodeName, textContent, childNodes }) => {
    if (nodeName === "#text") {
      return textContent;
    }

    const childName = nodeName.toLowerCase();
    const sourceChild = elemsLower?.get(childName);

    let translatedChildren = recursive
      ? translateChildren([...childNodes], elemsLower, true)
      : [textContent];

    // If the child is not expected just take its content.
    if (!sourceChild) {
      return recursive
        ? createElement(Fragment, null, ...translatedChildren)
        : textContent;
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

    // TODO Protect contents of elements wrapped in <Localized>
    // https://github.com/projectfluent/fluent.js/issues/184
    // TODO  Control localizable attributes on elements passed as props
    // https://github.com/projectfluent/fluent.js/issues/185
    return cloneElement(sourceChild, undefined, ...translatedChildren);
  });
}
