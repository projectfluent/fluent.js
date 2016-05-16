import { MessageContext } from '../intl/context';
import { Localization } from '../lib/localization';

import { getDirection } from './shims';
import {
  initMutationObserver, translateRoots, observe, disconnect
} from './observer';
import {
  setAttributes, getAttributes, translateFragment
} from './dom';

const properties = new WeakMap();
const contexts = new WeakMap();

export class HTMLLocalization extends Localization {
  constructor(doc, requestBundles) {
    super();
    this.interactive = requestBundles();
    this.ready = this.interactive
      .then(bundles => fetchFirstBundle(bundles))
      .then(bundles => translateDocument(this, bundles));

    properties.set(this, { doc, requestBundles, ready: false });
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

  formatEntities(...keys) {
    // XXX add async fallback
    return this.interactive.then(
      ([bundle]) => this._formatKeysFromContext(
        contexts.get(bundle), keys, this._formatEntityFromContext
      )
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

HTMLLocalization.prototype.setAttributes = setAttributes;
HTMLLocalization.prototype.getAttributes = getAttributes;

function createContextFromBundle(bundle) {
  return bundle.fetch().then(resources => {
    const ctx = new MessageContext(bundle.lang);
    resources.forEach(res => ctx.addMessages(res));
    contexts.set(bundle, ctx);
    return ctx;
  });
}

function fetchFirstBundle(bundles) {
  const [bundle] = bundles;
  return createContextFromBundle(bundle).then(
    () => bundles
  );
}

function changeLanguages(l10n, oldBundles, requestedLangs) {
  const { requestBundles } = properties.get(l10n);

  l10n.interactive = requestBundles(requestedLangs).then(
    newBundles => equal(oldBundles, newBundles) ?
      oldBundles : fetchFirstBundle(newBundles)
  );

  return l10n.interactive.then(
    bundles => translateDocument(l10n, bundles)
  );
}

function equal(bundles1, bundles2) {
  return bundles1.length === bundles2.length &&
    bundles1.every(({lang}, i) => lang === bundles2[i].lang);
}

function translateDocument(l10n, bundles) {
  const langs = bundles.map(bundle => bundle.lang);
  const props = properties.get(l10n);
  const html = props.doc.documentElement;

  if (props.ready) {
    return translateRoots(l10n).then(
      () => setAllAndEmit(html, langs)
    );
  }

  const translated = translateRoots(l10n).then(
    () => setLangDir(html, langs)
  );

  return translated.then(() => {
    setLangs(html, langs);
    props.ready = true;
  });
}

function setLangs(html, langs) {
  html.setAttribute('langs', langs.join(' '));
}

function setLangDir(html, [lang]) {
  html.setAttribute('lang', lang);
  html.setAttribute('dir', getDirection(lang));
}

function setAllAndEmit(html, langs) {
  setLangDir(html, langs);
  setLangs(html, langs);
  html.parentNode.dispatchEvent(new CustomEvent('DOMRetranslated', {
    bubbles: false,
    cancelable: false,
  }));
}
