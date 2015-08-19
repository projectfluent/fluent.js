'use strict';

import { applyTranslation, applyTranslations } from './overlay';

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

export function translateMutations(view, langs, mutations) {
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
              targets.add(addedNode);
            }
          }
        }
        break;
    }
  }

  if (targets.size === 0) {
    return;
  }

  translateElements(view, langs, Array.from(targets));
}

export function translateFragment(view, langs, frag) {
  return translateElements(view, langs, getTranslatables(frag));
}

function getElementTranslation(view, langs, elem) {
  const id = elem.getAttribute('data-l10n-id');

  if (!id) {
    return false;
  }

  const args = elem.getAttribute('data-l10n-args');

  if (!args) {
    return view.ctx.resolve(langs, id);
  }

  return view.ctx.resolve(
    langs, id, JSON.parse(
      args.replace(reHtml, match => htmlEntities[match])));
}

function translateElements(view, langs, elements) {
  return Promise.all(
    elements.map(elem => getElementTranslation(view, langs, elem))).then(
      translations => applyTranslations(view, elements, translations));
}

export function translateElement(view, langs, elem) {
  return getElementTranslation(view, langs, elem).then(translation => {
    if (!translation) {
      return false;
    }

    view.disconnect();
    applyTranslation(view, elem, translation);
    view.observe();
  });
}
