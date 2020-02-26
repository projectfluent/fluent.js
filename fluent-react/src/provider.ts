import { createElement, memo, ReactNode, ReactElement } from "react";
import PropTypes from "prop-types";
import { FluentBundle } from "@fluent/bundle";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";
import { MarkupParser } from "./markup";

interface LocalizationProviderProps {
  children?: ReactNode;
  bundles?: Iterable<FluentBundle>;
  parseMarkup?: MarkupParser | null;
}

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
 * The `LocalizationProvider` component takes `bundles` as a prop.  It should
 * be an iterable of `FluentBundle` instances in order of the user's
 * preferred languages.  The `FluentBundle` instances will be used by
 * `ReactLocalization` to format translations.  If a translation is missing in
 * one instance, `ReactLocalization` will fall back to the next one.
 */
function LocalizationProvider(props: LocalizationProviderProps): ReactElement {
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

function isIterable(
  props: Record<string, unknown>,
  propName: string,
  componentName: string
): null | Error {
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

export let MemoLocalizationProvider = memo(LocalizationProvider);
