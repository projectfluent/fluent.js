import { disconnect, reconnect } from './observer';
import { overlayElement } from './overlay';

const reHtml = /[&<>]/g;
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

export function setAttributes(element, id, args) {
  element.setAttribute('data-l10n-id', id);
  if (args) {
    element.setAttribute('data-l10n-args', JSON.stringify(args));
  }
  return element;
}

export function getAttributes(element) {
  return {
    id: element.getAttribute('data-l10n-id'),
    args: JSON.parse(element.getAttribute('data-l10n-args'))
  };
}

function getTranslatables(element) {
  const nodes = Array.from(element.querySelectorAll('[data-l10n-id]'));

  if (typeof element.hasAttribute === 'function' &&
      element.hasAttribute('data-l10n-id')) {
    nodes.push(element);
  }

  return nodes;
}

export function translateMutations(view, mutations) {
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
              getTranslatables(addedNode).forEach(targets.add.bind(targets));
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

  translateElements(view, Array.from(targets));
}

export function translateFragment(view, frag) {
  return translateElements(view, getTranslatables(frag));
}

function getElementsTranslation(view, elems) {
  const keys = elems.map(elem => {
    const id = elem.getAttribute('data-l10n-id');
    const args = elem.getAttribute('data-l10n-args');
    return args ? [
      id,
      JSON.parse(args.replace(reHtml, match => htmlEntities[match]))
    ] : id;
  });

  return view.formatEntities(keys);
}

function translateElements(view, elements) {
  return getElementsTranslation(view, elements).then(
    translations => applyTranslations(view, elements, translations));
}

function applyTranslations(view, elems, translations) {
  disconnect(view, null, true);
  for (let i = 0; i < elems.length; i++) {
    overlayElement(elems[i], translations[i]);
  }
  reconnect(view);
}
