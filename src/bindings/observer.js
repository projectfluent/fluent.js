import { translateMutations } from './dom';
import { overlayElement } from './overlay';

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
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

export class LocalizationObserver {
  constructor() {
    this.roots = new Set();
    this.observer = new MutationObserver(
      mutations => this.translateMutations(mutations)
    );
  }

  observeRoot(root) {
    this.roots.add(root);
    this.observer.observe(root, observerConfig);
  }

  disconnectRoot(root) {
    this.pause();
    this.roots.delete(root);
    this.resume();
  }

  pause() {
    this.observer.disconnect();
  }

  resume() {
    this.roots.forEach(
      root => this.observer.observe(root, observerConfig)
    );
  }

  getLocalizationById() {
    return this;
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

    translateElements(this, Array.from(targets));
  }

}

export function translateFragment(obs, frag) {
  return translateElements(obs, getTranslatables(frag));
}

// XXX the following needs to be optimized, perhaps getTranslatables should 
// sort elems by localization they refer to so that it is easy to group them, 
// handle each group individually and finally concatenate the resulting 
// translations into a flat array whose element correspond one-to-one to elems?

function getElementsTranslation(obs, elems) {
  const keys = elems.map(elem => {
    const args = elem.getAttribute('data-l10n-args');
    return [
      obs.getLocalizationById(elem.getAttribute('localization')),
      elem.getAttribute('data-l10n-id'),
      args ? JSON.parse(args.replace(reHtml, match => htmlEntities[match])) : null
    ];
  });

  return Promise.all(
    keys.map(
      ([l10n, id, args]) => l10n.formatEntities([[id, args]])
    )
  );
}

function translateElements(obs, elements) {
  return getElementsTranslation(obs, elements).then(
    translations => applyTranslations(obs, elements, translations));
}

function applyTranslations(obs, elems, translations) {
  obs.pause();
  for (let i = 0; i < elems.length; i++) {
    // XXX [0] is an artifact of the Promise.all above; remove it
    overlayElement(elems[i], translations[i][0]);
  }
  obs.resume();
}
