import { createElement, ReactNode, ReactElement, memo } from "react";
import PropTypes from "prop-types";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";

interface LocalizationProviderProps {
  children?: ReactNode;
  l10n: ReactLocalization;
}

/*
 * The Provider component for the `ReactLocalization` class.
 *
 * Exposes a `ReactLocalization` instance to all descendants via React's
 * context feature.  It makes translations available to all localizable
 * elements in the descendant's render tree without the need to pass them
 * explicitly.
 *
 *     <LocalizationProvider l10n={…}>
 *         …
 *     </LocalizationProvider>
 *
 * `LocalizationProvider` takes an instance of `ReactLocalization` in the
 * `l10n` prop. This instance will be made available to `Localized` components
 * under the provider.
 */
function LocalizationProvider(props: LocalizationProviderProps): ReactElement {
  if (props.l10n === undefined) {
    throw new Error("LocalizationProvider must receive the l10n prop.");
  }

  if (!(props.l10n instanceof ReactLocalization)) {
    throw new Error("The bundles prop must be an iterable.");
  }

  return createElement(
    FluentContext.Provider,
    {
      value: props.l10n
    },
    props.children
  );
}

LocalizationProvider.propTypes = {
  children: PropTypes.element.isRequired,
  l10n: isReactLocalization,
};

function isReactLocalization(
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

  if (prop instanceof ReactLocalization) {
    return null;
  }

  return new Error(
    `The ${propName} prop supplied to ${componentName} must be an instance \
of ReactLocalization.`
  );
}

export const MemoLocalizationProvider = memo(LocalizationProvider);
