/*
 * @module fluent-langneg
 * @overview
 *
 * `fluent-langneg` provides language negotiation API that fits into
 * Project Fluent localization composition and fallbacking strategy.
 *
 */

export {
  negotiateLanguages,
  NegotiateLanguagesOptions,
} from "./negotiate_languages.js";
export { acceptedLanguages } from "./accepted_languages.js";
export { filterMatches } from "./matches.js";
