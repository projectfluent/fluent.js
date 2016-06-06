import { keysFromContext, valueFromContext, entityFromContext }
  from '../../lib/format';

const properties = new WeakMap();
export const contexts = new WeakMap();

export class Localization {
  constructor(requestBundles, createContext) {
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

  formatEntities(keys) {
    // XXX add async fallback
    return this.interactive.then(
      ([bundle]) => keysFromContext(
        contexts.get(bundle), keys, entityFromContext
      )
    );
  }

  formatValues(...keys) {
    return this.interactive.then(
      ([bundle]) => keysFromContext(
        contexts.get(bundle), keys, valueFromContext
      )
    );
  }

  formatValue(id, args) {
    return this.formatValues([id, args]).then(
      ([val]) => val
    );
  }

  setAttributes(element, id, args) {
    element.setAttribute('data-l10n-id', id);
    if (args) {
      element.setAttribute('data-l10n-args', JSON.stringify(args));
    }
    return element;
  }

  getAttributes(element) {
    return {
      id: element.getAttribute('data-l10n-id'),
      args: JSON.parse(element.getAttribute('data-l10n-args'))
    };
  }

}

function createContextFromBundle(bundle, createContext) {
  return bundle.fetch().then(resources => {
    const ctx = createContext(bundle.lang);
    resources
      .filter(res => !(res instanceof Error))
      .forEach(res => ctx.addMessages(res));
    contexts.set(bundle, ctx);
    return ctx;
  });
}

function fetchFirstBundle(bundles, createContext) {
  const [bundle] = bundles;
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
