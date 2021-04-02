import { createElement, ReactNode, ReactElement, useState } from "react";
import PropTypes from "prop-types";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";

interface LocalizationProviderProps {
  children?: ReactNode;
  l10n: ReactLocalization;
  changeLocales: (locales: string[]) => void;
  initialLocales: string[];
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
export function LocalizationProvider(
  props: LocalizationProviderProps
): ReactElement {
  let [locales, setLocales] = useState(props.initialLocales);

  function changeLocales(locales: string[]) {
    props.changeLocales(locales);
    setLocales(locales);
  }

  return createElement(
    FluentContext.Provider,
    {
      value: {
        l10n: props.l10n,
        changeLocales: changeLocales,
        currentLocales: locales
      }
    },
    props.children
  );
}

LocalizationProvider.propTypes = {
  children: PropTypes.element.isRequired,
  l10n: PropTypes.instanceOf(ReactLocalization).isRequired,
};
