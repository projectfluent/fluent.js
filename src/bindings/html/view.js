import { pseudo } from '../../lib/pseudo';
import { negotiateLanguages } from './langs';
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
  constructor(env, doc) {
    this.pseudo = {
      'fr-x-psaccent': createPseudo(this, 'fr-x-psaccent'),
      'ar-x-psbidi': createPseudo(this, 'ar-x-psbidi')
    };

    this.interactive = documentReady().then(() => init(this));
    this.ready = this.interactive.then(
      ({langs}) => translateView(this, langs).then(
        () => langs
      )
    );
    initMutationObserver(this);

    viewProps.set(this, {
      doc, env, ready: false
    });
  }

  requestLanguages(requestedLangs) {
    return this.ready = this.interactive.then(
      ({langs, ctx}) => changeLanguages(this, ctx, langs, requestedLangs)
    );
  }

  handleEvent() {
    return this.requestLanguages(navigator.languages);
  }

  formatEntities(...keys) {
    return this.interactive.then(
      ({ctx}) => ctx.formatEntities(...keys)
    );
  }

  formatValue(id, args) {
    return this.interactive
      .then(({ctx}) => ctx.formatValues([id, args]))
      .then(([val]) => val);
  }

  formatValues(...keys) {
    return this.interactive.then(
      ({ctx}) => ctx.formatValues(...keys)
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

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

function createPseudo(view, code) {
  return {
    getName() { return pseudo[code].name; },
    processString(code, str) {
      return pseudo[code].process(str);
    }
  };
}

function init(view) {
  const props = viewProps.get(view);
  const resources = getResourceLinks(props.doc.head);
  const meta = getMeta(props.doc.head);

  view.observeRoot(props.doc.documentElement);
  const { langs } = negotiateLanguages(meta, [], navigator.languages);
  const ctx = props.env.createContext(langs, resources);

  return { langs, ctx };
}

function changeLanguages(view, oldCtx, prevLangs, requestedLangs) {
  const { doc, env } = viewProps.get(view);
  const meta = getMeta(doc.head);

  const { langs, haveChanged } = negotiateLanguages(
    meta, prevLangs, requestedLangs
  );

  if (!haveChanged) {
    return langs;
  }

  const ctx = env.createContext(langs, oldCtx.resIds);
  view.interactive = Promise.resolve({langs, ctx});

  return translateView(view, langs).then(
    () => langs
  );
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
