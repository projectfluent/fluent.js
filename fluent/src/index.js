/*
 * @module fluent
 * @overview
 *
 * `fluent` is a JavaScript implementation of Project Fluent, a localization
 * framework designed to unleash the expressive power of the natural language.
 *
 */

export { default as FluentBundle } from "./bundle";
export { default as FluentResource } from "./resource";
export { FluentType, FluentNumber, FluentDateTime } from "./types";

export { ftl } from "./util";
