import { getDirection } from '../intl/locale';

import { keysFromContext, valueFromContext, entityFromContext }
  from '../lib/format';

import { initMutationObserver, translateRoots, observe, disconnect }
  from './observer';
import { setAttributes, getAttributes, translateFragment }
  from './dom';

const properties = new WeakMap();
export const contexts = new WeakMap();

export class Localization {
  constructor(doc, requestBundles, createContext) {
    this.interactive = requestBundles().then(
      bundles => fetchFirstBundle(bundles, createContext)
    );
    this.ready = this.interactive.then(
      bundles => translateDocument(this, bundles)
    );

    properties.set(this, {
      doc, requestBundles, createContext, ready: false
    });
    initMutationObserver(this);
    this.observeRoot(doc.documentElement);
  }

  requestLanguages(requestedLangs) {
    return this.ready = this.interactive.then(
      bundles => changeLanguages(this, bundles, requestedLangs)
    );
  }

  handleEvent() {
    return this.requestLanguages();
  }

  formatWithFallback(bundles, keys, method, prev) {
    const ctx = contexts.get(bundles[0]);

    if (!ctx) {
      return prev.map(tuple => tuple[0]);
    }

    const [translations, errors] = keysFromContext(ctx, keys, method, prev);

    if (errors.length === 0) {
      return translations.map(tuple => tuple[0]);
    }

    // XXX report/emit errors?
    // errors.forEach(e => console.warn(e));

    const { createContext } = properties.get(this);
    return fetchFirstBundle(bundles.slice(1), createContext).then(
      bundles => this.formatWithFallback(bundles, keys, method, translations)
    );
  }

  formatEntities(...keys) {
    return this.interactive.then(
      bundles => this.formatWithFallback(bundles, keys, entityFromContext)
    );
  }

  formatValues(...keys) {
    return this.interactive.then(
      bundles => this.formatWithFallback(bundles, keys, valueFromContext)
    );
  }

  formatValue(id, args) {
    return this.formatValues([id, args]).then(
      ([val]) => val
    );
  }

  translateFragment(frag) {
    return translateFragment(this, frag);
  }

  observeRoot(root) {
    observe(this, root);
  }

  disconnectRoot(root) {
    disconnect(this, root);
  }
}

Localization.prototype.setAttributes = setAttributes;
Localization.prototype.getAttributes = getAttributes;

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

  if (!bundle) {
    return Promise.resolve(bundles);
  }

  return createContextFromBundle(bundle, createContext).then(
    () => bundles
  );
}

function changeLanguages(l10n, oldBundles, requestedLangs) {
  const { requestBundles, createContext } = properties.get(l10n);

  l10n.interactive = requestBundles(requestedLangs).then(
    newBundles => equal(oldBundles, newBundles) ?
      oldBundles : fetchFirstBundle(newBundles, createContext)
  );

  return l10n.interactive.then(
    bundles => translateDocument(l10n, bundles)
  );
}

function equal(bundles1, bundles2) {
  return bundles1.length === bundles2.length &&
    bundles1.every(({lang}, i) => lang === bundles2[i].lang);
}

export function translateDocument(l10n, bundles) {
  const langs = bundles.map(bundle => bundle.lang);
  const props = properties.get(l10n);
  const html = props.doc.documentElement;

  function setLangs() {
    html.setAttribute('langs', langs.join(' '));
    html.setAttribute('lang', langs[0]);
    html.setAttribute('dir', getDirection(langs[0]));
  }

  function emit() {
    html.parentNode.dispatchEvent(new CustomEvent('DOMRetranslated', {
      bubbles: false,
      cancelable: false,
    }));
  }

  const next = props.ready ?
    emit : () => props.ready = true;

  return translateRoots(l10n)
    .then(setLangs)
    .then(next);
}
