/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global console */

// @ts-expect-error Ignore types
import { CachedAsyncIterable } from "cached-iterable";

import type { FluentBundle, FluentVariable, Message } from "@fluent/bundle";

export type MessageKey =
  | string
  | { id: string; args?: Record<string, FluentVariable> };
export type FormatMethod<T> = (
  bundle: FluentBundle,
  messageErrors: Error[],
  message: Message,
  args: Record<string, FluentVariable> | undefined
) => T;
export type FormattedMessage = {
  value: string | null;
  attributes: Array<{ name: string; value: string }> | null;
};

/**
 * The `Localization` class is a central high-level API for vanilla
 * JavaScript use of Fluent.
 * It combines language negotiation, FluentBundle and I/O to
 * provide a scriptable API to format translations.
 */
export class Localization {
  declare bundles: AsyncIterable<FluentBundle>;
  resourceIds: string[];
  generateBundles: (resourceIds: string[]) => Iterable<FluentBundle>;

  constructor(
    resourceIds: string[] = [],
    generateBundles: (resourceIds: string[]) => Iterable<FluentBundle>
  ) {
    this.resourceIds = resourceIds;
    this.generateBundles = generateBundles;
    this.onChange(true);
  }

  addResourceIds(resourceIds: string[], eager = false): number {
    this.resourceIds.push(...resourceIds);
    this.onChange(eager);
    return this.resourceIds.length;
  }

  removeResourceIds(resourceIds: string[]): number {
    this.resourceIds = this.resourceIds.filter(r => !resourceIds.includes(r));
    this.onChange();
    return this.resourceIds.length;
  }

  /**
   * Format translations and handle fallback if needed.
   *
   * Format translations for `keys` from `FluentBundle` instances on this
   * DOMLocalization. In case of errors, fetch the next context in the
   * fallback chain.
   */
  private async formatWithFallback<T>(
    keys: MessageKey[],
    method: FormatMethod<T>
  ): Promise<T[]> {
    const translations: T[] = [];
    let hasAtLeastOneBundle = false;

    for await (const bundle of this.bundles) {
      hasAtLeastOneBundle = true;
      const missingIds = keysFromBundle(method, bundle, keys, translations);

      if (missingIds.size === 0) {
        break;
      }

      if (typeof console !== "undefined") {
        const locale = bundle.locales[0];
        const ids = Array.from(missingIds).join(", ");
        console.warn(`[fluent] Missing translations in ${locale}: ${ids}`);
      }
    }

    if (!hasAtLeastOneBundle && typeof console !== "undefined") {
      console.warn(`[fluent] Request for keys failed because no resource bundles got generated.
  keys: ${JSON.stringify(keys)}.
  resourceIds: ${JSON.stringify(this.resourceIds)}.`);
    }

    return translations;
  }

  /**
   * Format translations into `{value, attributes}` objects.
   *
   * The fallback logic is the same as in `formatValues`
   * but it returns `{value, attributes}` objects
   * which are suitable for the translation of DOM elements.
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @example
   * ```js
   * docL10n.formatMessages([
   *   {id: 'hello', args: { who: 'Mary' }},
   *   {id: 'welcome'}
   * ]).then(console.log);
   *
   * // [
   * //   { value: 'Hello, Mary!', attributes: null },
   * //   {
   * //     value: 'Welcome!',
   * //     attributes: [ { name: "title", value: 'Hello' } ]
   * //   }
   * // ]
   * ```
   */
  formatMessages(keys: MessageKey[]): Promise<FormattedMessage[]> {
    return this.formatWithFallback(keys, messageFromBundle);
  }

  /**
   * Retrieve translations corresponding to the passed keys.
   *
   * A generalized version of `DOMLocalization.formatValue`. Keys must
   * be `{id, args}` objects.
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @example
   * ```js
   * docL10n.formatValues([
   *   {id: 'hello', args: { who: 'Mary' }},
   *   {id: 'hello', args: { who: 'John' }},
   *   {id: 'welcome'}
   * ]).then(console.log);
   *
   * // ['Hello, Mary!', 'Hello, John!', 'Welcome!']
   * ```
   */
  formatValues(keys: MessageKey[]): Promise<Array<string | null>> {
    return this.formatWithFallback(keys, valueFromBundle);
  }

  /**
   * Retrieve the translation corresponding to the `id` identifier.
   *
   * If passed, `args` is a simple hash object with a list of variables that
   * will be interpolated in the value of the translation.
   *
   * Returns a Promise resolving to the translation string.
   *
   * Use this sparingly for one-off messages which don't need to be
   * retranslated when the user changes their language preferences, e.g. in
   * notifications.
   *
   * @example
   * ```js
   * docL10n.formatValue(
   *   'hello', { who: 'world' }
   * ).then(console.log);
   *
   * // 'Hello, world!'
   * ```
   */
  async formatValue(
    id: string,
    args?: Record<string, FluentVariable>
  ): Promise<string | null> {
    const [val] = await this.formatValues([{ id, args }]);
    return val;
  }

  handleEvent(): void {
    this.onChange();
  }

  /**
   * This method should be called when there's a reason to believe
   * that language negotiation or available resources changed.
   */
  onChange(eager = false): void {
    // eslint-disable-next-line
    this.bundles = CachedAsyncIterable.from(
      this.generateBundles(this.resourceIds)
    );
    if (eager) {
      // @ts-expect-error cached-iterable is not typed
      // eslint-disable-next-line
      this.bundles.touchNext(2);
    }
  }
}

/**
 * Format the value of a message into a string or `null`.
 *
 * This function is passed as a method to `keysFromBundle` and resolve
 * a value of a single L10n Entity using provided `FluentBundle`.
 *
 * If the message doesn't have a value, return `null`.
 *
 * @private
 */
function valueFromBundle(
  bundle: FluentBundle,
  errors: Error[],
  message: Message,
  args: Record<string, FluentVariable> | undefined
): string | null {
  if (message.value) {
    return bundle.formatPattern(message.value, args, errors);
  }

  return null;
}

/**
 * Format all public values of a message into a {value, attributes} object.
 *
 * This function is passed as a method to `keysFromBundle` and resolve
 * a single L10n Entity using provided `FluentBundle`.
 *
 * The function will return an object with a value and attributes of the
 * entity.
 *
 * @private
 */
function messageFromBundle(
  bundle: FluentBundle,
  errors: Error[],
  message: Message,
  args: Record<string, FluentVariable> | undefined
): FormattedMessage {
  const formatted: FormattedMessage = {
    value: null,
    attributes: null,
  };

  if (message.value) {
    formatted.value = bundle.formatPattern(message.value, args, errors);
  }

  let attrNames = Object.keys(message.attributes);
  if (attrNames.length > 0) {
    formatted.attributes = new Array(attrNames.length);
    for (let [i, name] of attrNames.entries()) {
      let value = bundle.formatPattern(message.attributes[name], args, errors);
      formatted.attributes[i] = { name, value };
    }
  }

  return formatted;
}

/**
 * This function is an inner function for `Localization.formatWithFallback`.
 *
 * It takes a `FluentBundle`, list of l10n-ids and a method to be used for
 * key resolution (either `valueFromBundle` or `messageFromBundle`) and
 * optionally a value returned from `keysFromBundle` executed against
 * another `FluentBundle`.
 *
 * The idea here is that if the previous `FluentBundle` did not resolve
 * all keys, we're calling this function with the next context to resolve
 * the remaining ones.
 *
 * In the function, we loop over `keys` and check if we have the `prev`
 * passed and if it has an error entry for the position we're in.
 *
 * If it doesn't, it means that we have a good translation for this key and
 * we return it. If it does, we'll try to resolve the key using the passed
 * `FluentBundle`.
 *
 * In the end, we fill the translations array, and return the Set with
 * missing ids.
 *
 * See `Localization.formatWithFallback` for more info on how this is used.
 *
 * @private
 */
function keysFromBundle<T>(
  method: FormatMethod<T>,
  bundle: FluentBundle,
  keys: MessageKey[],
  translations: T[]
): Set<string> {
  const messageErrors: Error[] = [];
  const missingIds = new Set<string>();

  keys.forEach((key, i) => {
    if (translations[i] !== undefined) {
      return;
    }

    let id: string;
    let args: Record<string, FluentVariable> | undefined;
    if (typeof key === "string") {
      id = key;
      args = undefined;
    } else {
      id = key.id;
      args = key.args;
    }

    let message = bundle.getMessage(id);
    if (message) {
      messageErrors.length = 0;
      translations[i] = method(bundle, messageErrors, message, args);
      if (messageErrors.length > 0 && typeof console !== "undefined") {
        const locale = bundle.locales[0];
        const errors = messageErrors.join(", ");
        console.warn(
          `[fluent][resolver] errors in ${locale}/${id}: ${errors}.`
        );
      }
    } else {
      missingIds.add(id);
    }
  });

  return missingIds;
}
