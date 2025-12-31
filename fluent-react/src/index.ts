/**
 * React bindings for Fluent.
 * Takes advantage of React's Components system and the virtual DOM.
 * Translations are exposed to components via the provider pattern.
 *
 * Consult the documentation of the {@link LocalizationProvider} and the {@link Localized}
 * components for more information.
 *
 * @example
 * ```jsx
 * <LocalizationProvider l10n={…}>
 *     <Localized id="hello-world">
 *         <p>{'Hello, world!'}</p>
 *     </Localized>
 * </LocalizationProvider>
 * ```
 *
 * @module
 */

export { ReactLocalization } from "./localization.js";
export { LocalizationProvider } from "./provider.js";
export {
  withLocalization,
  type WithLocalizationProps,
} from "./with_localization.js";
export { Localized, type LocalizedProps } from "./localized.js";
export type { MarkupParser } from "./markup.js";
export { useLocalization } from "./use_localization.js";
