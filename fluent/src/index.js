/*
 * @module fluent
 * @overview
 *
 * `fluent` is a JavaScript implementation of Project Fluent, a localization
 * framework designed to unleash the expressive power of the natural language.
 *
 */

export { default as _parse } from './parser';

export { MessageContext } from './context';
export {
  FluentType as MessageArgument,
  FluentNumber as MessageNumberArgument,
  FluentDateTime as MessageDateTimeArgument,
} from './types';

export { default as CachedIterable } from './cached_iterable';
export { mapContextSync, mapContextAsync } from './fallback';

export { ftl } from './util';
