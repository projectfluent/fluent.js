import { MessageContext } from '../intl/context';
import { Localization } from '../lib/localization';

import { documentReady, getDirection } from './shims';
import { getResourceLinks, getMeta } from './head';
import {
  initMutationObserver, translateRoots, observe, disconnect
} from './observer';
import {
  setAttributes, getAttributes, translateFragment
} from './dom';

const properties = new WeakMap();
const contexts = new WeakMap();

export class HTMLLocalization extends Localization {
  constructor(doc, provider) {
    super();
    this.interactive = documentReady().then(() => init(this));
    this.ready = this.interactive.then(
      bundles => translateDocument(this, bundles)
    );

    initMutationObserver(this);
    properties.set(this, {
      doc, provider, ready: false, resIds: []
    });
  }

  requestLanguages(requestedLangs) {
    return this.ready = this.interactive.then(
      bundles => changeLanguages(this, bundles, requestedLangs)
    );
  }

  handleEvent() {
    return this.requestLanguages(navigator.languages);
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

function init(l10n) {
  const props = properties.get(l10n);
  const meta = getMeta(props.doc.head);
  props.resIds = getResourceLinks(props.doc.head);
  props.defaultLang = meta.defaultLang;
  props.availableLangs = meta.availableLangs;

  l10n.observeRoot(props.doc.documentElement);

  const bundles = props.provider(
    props.resIds, props.defaultLang, props.availableLangs, navigator.languages
  );

  return fetchFirstBundle(bundles);
}

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
  const { resIds, defaultLang, availableLangs, provider } =
    properties.get(l10n);

  const bundles = provider(
    resIds, defaultLang, availableLangs, requestedLangs
  );

  const oldLangs = oldBundles.map(bundle => bundle.lang);
  const newLangs = bundles.map(bundle => bundle.lang);

  if (arrEqual(oldLangs, newLangs)) {
    return bundles;
  }

  l10n.interactive = fetchFirstBundle(bundles);

  return l10n.interactive.then(
    () => translateDocument(l10n, bundles)
  );
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
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
