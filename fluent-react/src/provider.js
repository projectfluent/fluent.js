import { createElement, memo } from "react";
import PropTypes from "prop-types";
import FluentContext from "./context";
import ReactLocalization from "./localization";

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
function LocalizationProvider(props) {
  if (props.bundles === undefined) {
    throw new Error("LocalizationProvider must receive the bundles prop.");
  }

  if (!props.bundles[Symbol.iterator]) {
    throw new Error("The bundles prop must be an iterable.");
  }

  return createElement(
    FluentContext.Provider,
    {
      value: new ReactLocalization(props.bundles, props.parseMarkup),
    },
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

export default memo(LocalizationProvider);
