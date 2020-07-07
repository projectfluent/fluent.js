/*
 * @module fluent-react
 * @overview
 *

 * `fluent-react` provides React bindings for Fluent.  It takes advantage of
 * React's Components system and the virtual DOM.  Translations are exposed to
 * components via the provider pattern.
 *
 *     <LocalizationProvider l10n={…}>
 *         <Localized id="hello-world">
 *             <p>{'Hello, world!'}</p>
 *         </Localized>
 *     </LocalizationProvider>
 *
 * Consult the documentation of the `LocalizationProvider` and the `Localized`
 * components for more information.
 */

export { ReactLocalization} from "./localization";
export { LocalizationProvider } from "./provider";
export { withLocalization, WithLocalizationProps } from "./with_localization";
export { Localized, LocalizedProps } from "./localized";
export { LocalizedElement, LocalizedElementProps } from "./localized_element";
export { LocalizedText, LocalizedTextProps } from "./localized_text";
export { MarkupParser } from "./markup";
export { useLocalization } from "./use_localization";
