'use strict';

import { translateFragment, translateElement } from './dom';

export default function MozL10nMutationObserver() {
  this._observer = null;
}

MozL10nMutationObserver.prototype.start = function() {
  if (!this._observer) {
    this._observer =
      new MutationObserver(onMutations.bind(navigator.mozL10n));
  }
  return this._observer.observe(document, this.CONFIG);
};

MozL10nMutationObserver.prototype.stop = function() {
  return this._observer.disconnect();
};

MozL10nMutationObserver.prototype.CONFIG = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

function onMutations(mutations) {
  var mutation;
  var targets = new Set();

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];
    if (mutation.type === 'childList') {
      var addedNode;

      for (var j = 0; j < mutation.addedNodes.length; j++) {
        addedNode = mutation.addedNodes[j];

        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        targets.add(addedNode);
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
