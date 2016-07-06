import { getDirection } from '../../intl/locale';

const reHtml = /[&<>]/g;
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

const observerConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args', 'data-l10n-bundle']
};

export class LocalizationObserver {
  constructor() {
    this.localizations = new Map();
    this.rootsByLocalization = new WeakMap();
    this.localizationsByRoot = new WeakMap();
    this.observer = new MutationObserver(
      mutations => this.translateMutations(mutations)
    );
  }

  has(name) {
    return this.localizations.has(name);
  }

  get(name) {
    return this.localizations.get(name);
  }

  set(name, value) {
    return this.localizations.set(name, value);
  }

  *[Symbol.iterator]() {
    yield* this.localizations;
  }

  handleEvent() {
    return this.requestLanguages();
  }

  requestLanguages(requestedLangs) {
    const localizations = Array.from(this.localizations.values());
    return Promise.all(
      localizations.map(l10n => l10n.requestLanguages(requestedLangs))
    ).then(
      () => this.translateAllRoots()
    )
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

  observeRoot(root, l10n = this.get('main')) {
    this.localizationsByRoot.set(root, l10n);
    if (!this.rootsByLocalization.has(l10n)) {
      this.rootsByLocalization.set(l10n, new Set());
    }
    this.rootsByLocalization.get(l10n).add(root);
    this.observer.observe(root, observerConfig);
  }

  disconnectRoot(root) {
    this.pause();
    this.localizationsByRoot.delete(root);
    for (let [name, l10n] of this.localizations) {
      const roots = this.rootsByLocalization.get(l10n);
      if (roots && roots.has(root)) {
        roots.delete(root);
        if (roots.size === 0) {
          this.delete(name);
          this.rootsByLocalization.delete(l10n);
        }
      }
    }
    this.resume();
  }

  pause() {
    this.observer.disconnect();
  }

  resume() {
    for (let l10n of this.localizations.values()) {
      if (this.rootsByLocalization.has(l10n)) {
        for (let root of this.rootsByLocalization.get(l10n)) {
          this.observer.observe(root, observerConfig)
        }
      }
    }
  }

  translateAllRoots() {
    const localizations = Array.from(this.localizations.values());
    return Promise.all(
      localizations.map(
        l10n => this.translateRoots(l10n)
      )
    );
  }

  translateRoots(l10n) {
    if (!this.rootsByLocalization.has(l10n)) {
      return Promise.resolve();
    }

    const roots = Array.from(this.rootsByLocalization.get(l10n));
    return Promise.all(
      roots.map(root => this.translateRoot(root, l10n))
    );
  }

  translateRoot(root, l10n = this.localizationsByRoot.get(root)) {
    return l10n.interactive.then(bundles => {
      const langs = bundles.map(bundle => bundle.lang);

      function setLangs() {
        const wasLocalizedBefore = root.hasAttribute('langs');

        root.setAttribute('langs', langs.join(' '));
        root.setAttribute('lang', langs[0]);
        root.setAttribute('dir', getDirection(langs[0]));

        if (wasLocalizedBefore) {
          root.dispatchEvent(new CustomEvent('DOMRetranslated', {
            bubbles: false,
            cancelable: false,
          }));
        }
      }

      return this.translateRootContent(root).then(setLangs);
    });
  }

  translateMutations(mutations) {
    const targets = new Set();

    for (let mutation of mutations) {
      switch (mutation.type) {
        case 'attributes':
          targets.add(mutation.target);
          break;
        case 'childList':
          for (let addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === addedNode.ELEMENT_NODE) {
              if (addedNode.childElementCount) {
                this.getTranslatables(addedNode).forEach(
                  targets.add.bind(targets)
                );
              } else {
                if (addedNode.hasAttribute('data-l10n-id')) {
                  targets.add(addedNode);
                }
              }
            }
          }
          break;
      }
    }

    if (targets.size === 0) {
      return;
    }

    this.translateElements(Array.from(targets));
  }

  translateFragment(frag) {
    return this.translateElements(this.getTranslatables(frag));
  }

  translateElements(elements) {
    const elemsByL10n = this.groupElementsByLocalization(elements);
    return this.getElementsTranslation(elemsByL10n).then(
      translations => this.applyTranslations(elemsByL10n, translations)
    );
  }

  applyTranslations(elemsByL10n, translationsByL10n) {
    this.pause();
    for (let [l10n, elems] of elemsByL10n) {
      const translations = translationsByL10n.get(l10n);
      for (let i = 0; i < elems.length; i++) {
        l10n.overlayElement(elems[i], translations[i]);
      }
    }
    this.resume();
  }

  groupElementsByLocalization(elements) {
    return Array.from(elements).reduce(
      (seq, elem) => {
        const l10n = this.getLocalizationForElement(elem);
        const group = (seq.get(l10n) || []).concat(elem);
        return seq.set(l10n, group);
      }, new Map()
    );
  }

  getTranslatables(element) {
    const nodes = Array.from(element.querySelectorAll('[data-l10n-id]'));

    if (typeof element.hasAttribute === 'function' &&
        element.hasAttribute('data-l10n-id')) {
      nodes.push(element);
    }

    return nodes;
  }

  getLocalizationForElement(elem) {
    return this.get(elem.getAttribute('data-l10n-bundle') || 'main');
  }

  getKeysForElements(elems) {
    return elems.map(elem => {
      const id = elem.getAttribute('data-l10n-id');
      const args = elem.getAttribute('data-l10n-args');

      return args ?
        [id, JSON.parse(args.replace(reHtml, match => htmlEntities[match]))] :
        id;
    });
  }

  getElementsTranslation(elemsByL10n) {
    return Promise.all(
      Array.from(elemsByL10n).map(
        ([l10n, elems]) => l10n.formatEntities(this.getKeysForElements(elems))
      )
    ).then(
      translationsList => Array.from(elemsByL10n.keys()).reduce(
        (seq, cur, idx) => seq.set(cur, translationsList[idx]),
        new Map()
      )
    );
  }

}
