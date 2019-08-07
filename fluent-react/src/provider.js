import { CachedSyncIterable } from "cached-iterable";
import { createElement, useMemo } from "react";
import PropTypes from "prop-types";
import { mapBundleSync } from "@fluent/sequence";
import FluentContext from "./context";
import createParseMarkup from "./markup";

/*
 * The Provider component for the `ReactLocalization` class.
 *
 * Exposes a `ReactLocalization` instance to all descendants via React's
 * context feature.  It makes translations available to all localizable
 * elements in the descendant's render tree without the need to pass them
 * explicitly.
 *
 *     <LocalizationProvider bundles={…}>
 *         …
 *     </LocalizationProvider>
 *
 * The `LocalizationProvider` component takes one prop: `bundles`.  It should
 * be an iterable of `FluentBundle` instances in order of the user's
 * preferred languages.  The `FluentBundle` instances will be used by
 * `ReactLocalization` to format translations.  If a translation is missing in
 * one instance, `ReactLocalization` will fall back to the next one.
 */
export default function LocalizationProvider(props) {
  if (props.bundles === undefined) {
    throw new Error("LocalizationProvider must receive the bundles prop.");
  }

  if (!props.bundles[Symbol.iterator]) {
    throw new Error("The bundles prop must be an iterable.");
  }

  const bundles = useMemo(() => CachedSyncIterable.from(props.bundles), [
    props.bundles
  ]);
  const parseMarkup = useMemo(() => props.parseMarkup || createParseMarkup(), [
    props.parseMarkup
  ]);
  const contextValue = useMemo(
    () => {
      const l10n = {
        getBundle: id => mapBundleSync(bundles, id),
        getString(id, args, fallback) {
          const bundle = l10n.getBundle(id);

          if (bundle) {
            const msg = bundle.getMessage(id);
            if (msg && msg.value) {
              let errors = [];
              let value = bundle.formatPattern(msg.value, args, errors);
              for (let error of errors) {
                l10n.reportError(error);
              }
              return value;
            }
          }

          return fallback || id;
        },
        // XXX Control this via a prop passed to the LocalizationProvider.
        // See https://github.com/projectfluent/fluent.js/issues/411.
        reportError(error) {
          /* global console */
          // eslint-disable-next-line no-console
          console.warn(`[@fluent/react] ${error.name}: ${error.message}`);
        }
      };
      return {
        l10n,
        parseMarkup
      };
    },
    [bundles, parseMarkup]
  );

  return createElement(
    FluentContext.Provider,
    { value: contextValue },
    props.children
  );
}

LocalizationProvider.propTypes = {
  children: PropTypes.element.isRequired,
  bundles: isIterable,
  parseMarkup: PropTypes.func
};

function isIterable(props, propName, componentName) {
  const prop = props[propName];

  if (!prop) {
    return new Error(
      `The ${propName} prop supplied to ${componentName} is required.`
    );
  }

  if (Symbol.iterator in Object(prop)) {
    return null;
  }

  return new Error(
    `The ${propName} prop supplied to ${componentName} must be an iterable.`
  );
}
