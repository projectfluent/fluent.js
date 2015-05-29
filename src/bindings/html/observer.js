'use strict';

import { translateFragment, translateElement } from './dom';

export default function MozL10nMutationObserver(view) {
  this.view = view;
  this.observer = null;
}

MozL10nMutationObserver.prototype.start = function() {
  if (!this.observer) {
    this.observer =
      new MutationObserver(onMutations.bind(this.view));
  }
  return this.observer.observe(this.view.doc, this.CONFIG);
};

MozL10nMutationObserver.prototype.stop = function() {
  return this.observer && this.observer.disconnect();
};

MozL10nMutationObserver.prototype.CONFIG = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

function onMutations(mutations) {
  let mutation;
  let targets = new Set();

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];

    if (mutation.type === 'childList') {
      for (var j = 0; j < mutation.addedNodes.length; j++) {
        let addedNode = mutation.addedNodes[j];
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          targets.add(addedNode);
        }
      }
    }

    if (mutation.type === 'attributes') {
      translateElement.call(this, mutation.target);
    }
  }

  targets.forEach(function(target) {
    if (target.childElementCount) {
      translateFragment.call(this, target);
    } else if (target.hasAttribute('data-l10n-id')) {
      translateElement.call(this, target);
    }
  }, this);
}
