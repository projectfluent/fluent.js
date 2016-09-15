import { keysFromContext, valueFromContext, entityFromContext }
  from '../format';

export const properties = new WeakMap();
export const contexts = new WeakMap();

/**
 * The `Localization` class is responsible for fetching resources and
 * formatting translations.
 *
 * l20n.js for HTML will create an instance of `Localization` for the default
 * set of `<link rel="localization">` elements.  You can get a reference to it
 * via:
 *
 *     const localization = document.l10n.get('main');
 *
 * Different names can be specified via the `name` attribute on the `<link>`
 * elements.
 */
export class Localization {

  /**
   * @param   {function}    requestBundles
   * @returns {Localization}
   */
  constructor(requestBundles, createContext) {

    /**
     * A Promise which resolves when the `Localization` instance has fetched
     * and parsed all localization resources in the user's first preferred
     * language (if available).
     *
     * ```javascript
     * localization.interactive.then(callback);
     * ```
     */
    this.interactive = requestBundles().then(
      bundles => fetchFirstBundle(bundles, createContext)
    );

    properties.set(this, {
      requestBundles, createContext
    });
  }

  requestLanguages(requestedLangs) {
    return this.interactive.then(
      bundles => changeLanguages(this, bundles, requestedLangs)
    );
  }

  formatWithFallback(bundles, keys, method, prev) {
    const ctx = contexts.get(bundles[0]);

    if (!ctx && prev) {
      return prev.translations;
    }

    const current = keysFromContext(ctx, keys, method, prev);

    if (!current.hasErrors) {
      return current.translations;
    }

    if (typeof console !== 'undefined') {
      current.errors.forEach(
        errs => errs.forEach(
          e => console.warn(e) // eslint-disable-line no-console
        )
      );
    }

    const { createContext } = properties.get(this);
    return fetchFirstBundle(bundles.slice(1), createContext).then(
      tailBundles => this.formatWithFallback(
        tailBundles, keys, method, current
      )
    );
  }

  formatEntities(keys) {
    return this.interactive.then(
      bundles => this.formatWithFallback(bundles, keys, entityFromContext)
    );
  }

  /**
   * A generalized version of `Localization.formatValue`.  Retrieve
   * translations corresponding to the passed keys.  Keys can either be simple
   * string identifiers or `[id, args]` arrays.
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * ```javascript
   * document.l10n.formatValues(
   *   ['hello', { who: 'Mary' }],
   *   ['hello', { who: 'John' }],
   *   'welcome'
   * ).then(([helloMary, helloJohn, welcome]) =>
   *   console.log(helloMary, helloJohn, welcome)
   * );
   * // -> 'Hello, Mary!', 'Hello, John!', 'Welcome!'
   * ```
   *
   * @returns {Promise}
   */
  formatValues(...keys) {
    const keyTuples = keys.map(
      key => Array.isArray(key) ? key : [key, null]
    );
    return this.interactive.then(
      bundles => this.formatWithFallback(bundles, keyTuples, valueFromContext)
    );
  }

  /**
   * Retrieve the translation corresponding to the `id` identifier.
   *
   * If passed, `args` is a simple hash object with a list of variables that
   * will be interpolated in the value of the translation.
   *
   * Returns a Promise resolving to the translation string.

   * ```javascript
   * localization.formatValue('hello', { who: 'world' }).then(
   *   hello => console.log(hello));
   * // -> 'Hello, world!'
   * ```
   *
   * Use this sparingly for one-off messages which don't need to be
   * retranslated when the user changes their language preferences.
   *
   * @returns {Promise}
   */
  formatValue(id, args) {
    return this.formatValues([id, args]).then(
      ([val]) => val
    );
  }

}

function createContextFromBundle(bundle, createContext) {
  return bundle.fetch().then(resources => {
    const ctx = createContext(bundle.lang);
    resources
      .filter(res => res !== null)
      .forEach(res => ctx.addMessages(res));
    contexts.set(bundle, ctx);
    return ctx;
  });
}

export function fetchFirstBundle(bundles, createContext) {
  const [bundle] = bundles;

  if (!bundle) {
    return Promise.resolve(bundles);
  }

  return createContextFromBundle(bundle, createContext).then(
    () => bundles
  );
}

function changeLanguages(l10n, oldBundles, requestedLangs) {
  const { requestBundles, createContext } = properties.get(l10n);

  return l10n.interactive = requestBundles(requestedLangs).then(
    newBundles => equal(oldBundles, newBundles) ?
      oldBundles : fetchFirstBundle(newBundles, createContext)
  );
}

function equal(bundles1, bundles2) {
  return bundles1.length === bundles2.length &&
    bundles1.every(({lang}, i) => lang === bundles2[i].lang);
}
