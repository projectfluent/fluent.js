/*
 * @module fluent
 * @overview
 *
 * `fluent` is a JavaScript implementation of Project Fluent, a localization
 * framework designed to unleash the expressive power of the natural language.
 *
 */

export { default as _parse } from "./parser";

export { FluentBundle } from "./context";
export { FluentType, FluentNumber, FluentDateTime } from "./types";

export { ftl } from "./util";
