/**
 * A JavaScript implementation of Project Fluent, a localization
 * framework designed to unleash the expressive power of the natural language.
 *
 * @module
 */

export type { Message } from "./ast.js";
export { FluentBundle, TextTransform } from "./bundle.js";
export { FluentResource } from "./resource.js";
export type { Scope } from "./scope.js";
export {
  FluentValue,
  FluentVariable,
  FluentType,
  FluentFunction,
  FluentNone,
  FluentNumber,
  FluentDateTime,
} from "./types.js";
