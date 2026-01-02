/**
 * A JavaScript implementation of Project Fluent, a localization
 * framework designed to unleash the expressive power of the natural language.
 *
 * @module
 */

export type { Message } from "./ast.js";
export { FluentBundle, type TextTransform } from "./bundle.js";
export { FluentResource } from "./resource.js";
export type { Scope } from "./scope.js";
export {
  type FluentValue,
  type FluentVariable,
  type FluentType,
  type FluentFunction,
  FluentNone,
  FluentNumber,
  FluentDateTime,
} from "./types.js";
