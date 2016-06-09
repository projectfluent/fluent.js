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

export class LocalizationObserver extends Map {
  constructor() {
    super();
    this.rootsByLocalization = new WeakMap();
    this.localizationsByRoot = new WeakMap();
    this.observer = new MutationObserver(
      mutations => this.translateMutations(mutations)
    );
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
    for (let [name, l10n] of this) {
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
    for (let l10n of this.values()) {
      if (this.rootsByLocalization.has(l10n)) {
        for (let root of this.rootsByLocalization.get(l10n)) {
          this.observer.observe(root, observerConfig)
        }
      }
    }
  }

  requestLanguages(requestedLangs) {
    const localizations = Array.from(this.values());
    return Promise.all(
      localizations.map(l10n => l10n.requestLanguages(requestedLangs))
    ).then(
      () => this.translateAllRoots()
    )
  }

  handleEvent() {
    return this.requestLanguages();
  }

  getTranslatables(element) {
    const nodes = Array.from(element.querySelectorAll('[data-l10n-id]'));

    if (typeof element.hasAttribute === 'function' &&
        element.hasAttribute('data-l10n-id')) {
      nodes.push(element);
    }

    return nodes;
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

  getLocalizationForElement(elem) {
    return this.get(elem.getAttribute('data-l10n-bundle') || 'main');
  }

  // XXX the following needs to be optimized, perhaps getTranslatables should 
  // sort elems by localization they refer to so that it is easy to group them, 
  // handle each group individually and finally concatenate the resulting 
  // translations into a flat array whose elements correspond one-to-one to 
  // elems?
  getElementsTranslation(elems) {
    const keys = elems.map(elem => {
      const args = elem.getAttribute('data-l10n-args');
      return [
        this.getLocalizationForElement(elem),
        elem.getAttribute('data-l10n-id'),
        args ?
          JSON.parse(args.replace(reHtml, match => htmlEntities[match])) :
          null
      ];
    });

    return Promise.all(
      keys.map(
        ([l10n, id, args]) => l10n.formatEntities([[id, args]]).then(
          translations => [l10n, translations]
        )
      )
    );
  }

  translateAllRoots() {
    const localizations = Array.from(this.values());
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
      roots.map(root => l10n.interactive.then(
        bundles => this.translateRoot(root)
      ))
    );
  }

  translateRoot(root) {
    const l10n = this.localizationsByRoot.get(root);
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

  translateFragment(frag) {
    return this.translateElements(this.getTranslatables(frag));
  }

  translateElements(elements) {
    return this.getElementsTranslation(elements).then(
      translations => this.applyTranslations(elements, translations));
  }

  applyTranslations(elems, translations) {
    this.pause();
    for (let i = 0; i < elems.length; i++) {
      const [l10n, [translation]] = translations[i];
      l10n.overlayElement(elems[i], translation);
    }
    this.resume();
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

