import { Localization } from './localization';

export class DocumentLocalization extends Localization {
  constructor(doc, resIds, generateContexts) {
    super(doc.location.href, resIds, generateContexts);
    this.document = doc;
    this.query = '[data-l10n-id]';
    this.roots = new Set();
    this.mutationObserver = new doc.defaultView.MutationObserver(
      mutations => this.translateMutations(mutations)
    );

    this.observerConfig = {
      attribute: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: ['data-l10n-id', 'data-l10n-args']
    };
  }

  onLanguageChange() {
    super.onLanguageChange();
    this.translateDocument();
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

  connectRoot(root) {
    this.roots.add(root);
    this.observeRoot(root);
  }

  disconnectRoot(root) {
    this.roots.delete(root);
    this.unobserveRoot(root);

    return this.roots.size === 0;
  }

  translateRoots() {
    const roots = Array.from(this.roots);
    return Promise.all(
      roots.map(root => this.translateRoot(root))
    );
  }

  translateRoot(root) {
    return this.translateFragment(root);
  }

  observeRoot(root) {
    this.roots.add(root);
    this.mutationObserver.observe(root, this.observerConfig);
  }

  unobserveRoot(root) {
    this.roots.delete(root);
    // Pause and resume the mutation observer to stop observing `root`.
    this.pauseObserving();
    this.resumeObserving();
  }

  pauseObserving() {
    this.mutationObserver.disconnect();
  }

  resumeObserving() {
    for (const root of this.roots) {
      this.mutationObserver.observe(root, this.observerConfig);
    }
  }

  translateMutations(mutations) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'attributes':
          this.translateElement(mutation.target);
          break;
        case 'childList':
          for (const addedNode of mutation.addedNodes) {
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

  translateDocument() {
    return this.translateRoots();
  }

  translateFragment(frag) {
    return this.translateElements(this.getTranslatables(frag));
  }

  translateElements(elements) {
    if (!elements.length) {
      return Promise.resolve([]);
    }

    const keys = elements.map(this.getKeysForElement);
    return this.formatEntities(keys).then(
      translations => this.applyTranslations(elements, translations)
    );
  }

  translateElement(element) {
    return this.formatEntities([this.getKeysForElement(element)]).then(
      translations => this.applyTranslations([element], translations)
    );
  }

  applyTranslations(elements, translations) {
    this.pauseObserving();

    for (let i = 0; i < elements.length; i++) {
      overlayElement(elements[i], translations[i]);
    }

    this.resumeObserving();
  }

  getTranslatables(element) {
    const nodes = Array.from(element.querySelectorAll(this.query));

    if (typeof element.hasAttribute === 'function' &&
        element.hasAttribute('data-l10n-id')) {
      const elemBundleName = element.getAttribute('data-l10n-with');
      if (elemBundleName === this.name) {
        nodes.push(element);
      }
    }

    return nodes;
  }

  getKeysForElement(element) {
    return [
      element.getAttribute('data-l10n-id'),
      JSON.parse(element.getAttribute('data-l10n-args') || null)
    ];
  }
}

function overlayElement(element, translation) {
  const value = translation.value;

  if (typeof value === 'string') {
    element.textContent = value;
  }

  if (translation.attrs === null) {
    return;
  }

  for (const [name, val] of translation.attrs) {
    element.setAttribute(name, val);
  }
}
