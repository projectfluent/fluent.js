import { documentReady, getDirection } from './shims';
import { getResourceLinks, getMeta } from './head';
import {
  initMutationObserver, translateRoots, observe, disconnect
} from './observer';
import {
  setAttributes, getAttributes, translateFragment
} from './dom';

const viewProps = new WeakMap();

export class View {
  constructor(client, doc) {
    this.pseudo = {
      'fr-x-psaccent': createPseudo(this, 'fr-x-psaccent'),
      'ar-x-psbidi': createPseudo(this, 'ar-x-psbidi')
    };

    const initialized = documentReady().then(() => init(this, client));
    this._interactive = initialized.then(() => client);
    this.ready = initialized.then(langs => translateView(this, langs));
    initMutationObserver(this);

    viewProps.set(this, {
      doc: doc,
      ready: false
    });

    client.on('languageschangerequest',
      requestedLangs => this.requestLanguages(requestedLangs));
  }

  requestLanguages(requestedLangs, isGlobal) {
    const method = isGlobal ?
      (client => client.method('requestLanguages', requestedLangs)) :
      (client => changeLanguages(this, client, requestedLangs));
    return this._interactive.then(method);
  }

  handleEvent() {
    return this.requestLanguages(navigator.languages);
  }

  formatEntities(...keys) {
    return this._interactive.then(
      client => client.method('formatEntities', client.id, keys));
  }

  formatValue(id, args) {
    return this._interactive.then(
      client => client.method('formatValues', client.id, [[id, args]])).then(
      values => values[0]);
  }

  formatValues(...keys) {
    return this._interactive.then(
      client => client.method('formatValues', client.id, keys));
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

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

function createPseudo(view, code) {
  return {
    getName: () => view._interactive.then(
      client => client.method('getName', code)),
    processString: str => view._interactive.then(
      client => client.method('processString', code, str)),
  };
}

function init(view, client) {
  const doc = viewProps.get(view).doc;
  const resources = getResourceLinks(doc.head);
  const meta = getMeta(doc.head);
  view.observeRoot(doc.documentElement);
  return getAdditionalLanguages().then(
    additionalLangs => client.method(
      'registerView', client.id, resources, meta, additionalLangs,
      navigator.languages));
}

function changeLanguages(view, client, requestedLangs) {
  const doc = viewProps.get(view).doc;
  const meta = getMeta(doc.head);
  return getAdditionalLanguages()
    .then(additionalLangs => client.method(
      'changeLanguages', client.id, meta, additionalLangs, requestedLangs
    ))
    .then(({langs, haveChanged}) => haveChanged ?
      translateView(view, langs) : undefined
    );
}

function getAdditionalLanguages() {
  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    return navigator.mozApps.getAdditionalLanguages()
      .catch(() => Object.create(null));
  }

  return Promise.resolve(Object.create(null));
}

export function translateView(view, langs) {
  const props = viewProps.get(view);
  const html = props.doc.documentElement;

  if (props.ready) {
    return translateRoots(view).then(
      () => setAllAndEmit(html, langs));
  }

  const translated =
    // has the document been already pre-translated?
    langs[0].code === html.getAttribute('lang') ?
      Promise.resolve() :
      translateRoots(view).then(
        () => setLangDir(html, langs));

  return translated.then(() => {
    setLangs(html, langs);
    props.ready = true;
  });
}

function setLangs(html, langs) {
  const codes = langs.map(lang => lang.code);
  html.setAttribute('langs', codes.join(' '));
}

function setLangDir(html, langs) {
  const code = langs[0].code;
  html.setAttribute('lang', code);
  html.setAttribute('dir', getDirection(code));
}

function setAllAndEmit(html, langs) {
  setLangDir(html, langs);
  setLangs(html, langs);
  html.parentNode.dispatchEvent(new CustomEvent('DOMRetranslated', {
    bubbles: false,
    cancelable: false,
  }));
}
