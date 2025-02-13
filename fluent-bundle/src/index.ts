/**
 * @module fluent
 * @overview
 *
 * `fluent` is a JavaScript implementation of Project Fluent, a localization
 * framework designed to unleash the expressive power of the natural language.
 *
 */

export type { Message } from "./ast.js";
export { FluentBundle, FluentVariable, TextTransform } from "./bundle.js";
export { FluentResource } from "./resource.js";
export type { Scope } from "./scope.js";
export { FluentCaster, FluentCastRegistry, defaultCaster } from "./cast.js";
export {
  FluentValue,
  FluentType,
  FluentFunction,
  FluentNone,
  FluentNumber,
  FluentDateTime,
} from "./types.js";
