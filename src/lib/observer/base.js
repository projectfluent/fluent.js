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
    this.roots = new WeakMap();
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
    if (!this.roots.has(l10n)) {
      this.roots.set(l10n, new Set());
    }
    this.roots.get(l10n).add(root);
    this.observer.observe(root, observerConfig);
  }

  disconnectRoot(root) {
    let wasLast = false;

    this.pause();
    for (let [name, l10n] of this.localizations) {
      const roots = this.roots.get(l10n);
      if (roots && roots.has(root)) {
        roots.delete(root);
        if (roots.size === 0) {
          wasLast = true;
          this.localizations.delete(name);
          this.roots.delete(l10n);
        }
      }
    }
    this.resume();

    return wasLast;
  }

  pause() {
    this.observer.disconnect();
  }

  resume() {
    for (let l10n of this.localizations.values()) {
      if (this.roots.has(l10n)) {
        for (let root of this.roots.get(l10n)) {
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
    if (!this.roots.has(l10n)) {
      return Promise.resolve();
    }

    const roots = Array.from(this.roots.get(l10n));
    return Promise.all(
      roots.map(root => this.translateRoot(root, l10n))
    );
  }

  translateRoot(root, l10n) {
    function setLangs() {
      return l10n.interactive.then(bundles => {
        const langs = bundles.map(bundle => bundle.lang);
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
      });
    }

    return this.translateRootContent(root).then(setLangs);
  }

  translateMutations(mutations) {
    for (let mutation of mutations) {
      switch (mutation.type) {
        case 'attributes':
          this.translateElement(mutation.target);
          break;
        case 'childList':
          for (let addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === addedNode.ELEMENT_NODE) {
              if (addedNode.childElementCount) {
                this.translateFragment(addedNode);
              } else if (addedNode.hasAttribute('data-l10n-id')) {
                this.translateElement(addedNode);
              }
            }
          }
          break;
      }
    }
  }

  translateFragment(frag) {
    return Promise.all(
      this.groupTranslatablesByLocalization(frag).map(
        elemsWithL10n => this.translateElements(
          elemsWithL10n[0], elemsWithL10n[1]
        )
      )
    );
  }

  translateElements(l10n, elements) {
    if (!elements.length) {
      return [];
    }

    const keys = elements.map(this.getKeysForElement);
    return l10n.formatEntities(keys).then(
      translations => this.applyTranslations(l10n, elements, translations)
    );
  }

  translateElement(element) {
    const l10n = this.get(element.getAttribute('data-l10n-bundle') || 'main');
    return l10n.formatEntities([this.getKeysForElement(element)]).then(
      translations => this.applyTranslations(l10n, [element], translations)
    );
  }

  applyTranslations(l10n, elements, translations) {
    this.pause();
    for (let i = 0; i < elements.length; i++) {
      l10n.overlayElement(elements[i], translations[i]);
    }
    this.resume();
  }

  groupTranslatablesByLocalization(frag) {
    const elemsWithL10n = [];
    for (let loc of this.localizations) {
      elemsWithL10n.push(
        [loc[1], this.getTranslatables(frag, loc[0])]
      );
    }
    return elemsWithL10n;
  }

  getTranslatables(element, bundleName) {
    const query = bundleName === 'main' ?
      '[data-l10n-bundle="main"], [data-l10n-id]:not([data-l10n-bundle])' :
      `[data-l10n-bundle=${bundleName}]`;
    const nodes = Array.from(element.querySelectorAll(query));

    if (typeof element.hasAttribute === 'function' &&
        element.hasAttribute('data-l10n-id')) {
      const elemBundleName = element.getAttribute('data-l10n-bundle');
      if (elemBundleName === null || elemBundleName === bundleName) {
        nodes.push(element);
      }
    }

    return nodes;
  }

  getKeysForElement(element) {
    const id = element.getAttribute('data-l10n-id');
    const args = element.getAttribute('data-l10n-args');
    const escapedArgs = args ?
      JSON.parse(args.replace(reHtml, match => htmlEntities[match])) : null;
    return [id, escapedArgs];
  }
}
