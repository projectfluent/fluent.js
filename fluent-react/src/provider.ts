import { createElement, ReactNode, ReactElement } from "react";
import { FluentContext } from "./context.js";
import { ReactLocalization } from "./localization.js";

/**
 * The Provider component for the `ReactLocalization` class.
 *
 * Exposes a `ReactLocalization` instance to all descendants via React's
 * context feature.  It makes translations available to all localizable
 * elements in the descendant's render tree without the need to pass them
 * explicitly.
 *
 * `LocalizationProvider` takes an instance of `ReactLocalization` in the
 * `l10n` prop. This instance will be made available to `Localized` components
 * under the provider.
 *
 * @example
 * ```jsx
 * <LocalizationProvider l10n={…}>
 *     …
 * </LocalizationProvider>
 * ```
 */
export function LocalizationProvider(props: {
  children: ReactNode;
  l10n: ReactLocalization;
}): ReactElement {
  return createElement(
    FluentContext.Provider,
    { value: props.l10n },
    props.children
  );
}
