'use strict';

/* jshint -W104 */
/* global pendingElements:true */
/* exported translateFragment, translateDocument, localizeElement */
/* exported setL10nAttributes, getL10nAttributes */

function translateDocument() {
  document.documentElement.lang = this.language.code;
  document.documentElement.dir = this.language.direction;
  translateFragment.call(this, document.documentElement);
}

function translateFragment(element) {
  if (element.hasAttribute('data-l10n-id')) {
    translateElement.call(this, element);
  }

  var nodes = getTranslatableChildren(element);
  for (var i = 0; i < nodes.length; i++ ) {
    translateElement.call(this, nodes[i]);
  }
}

function setL10nAttributes(element, id, args) {
  element.setAttribute('data-l10n-id', id);
  if (args) {
    element.setAttribute('data-l10n-args', JSON.stringify(args));
  }
}

function getL10nAttributes(element) {
  return {
    id: element.getAttribute('data-l10n-id'),
    args: JSON.parse(element.getAttribute('data-l10n-args'))
  };
}

function getTranslatableChildren(element) {
  return element ? element.querySelectorAll('*[data-l10n-id]') : [];
}

function localizeElement(element, id, args) {
  if (!id) {
    element.removeAttribute('data-l10n-id');
    element.removeAttribute('data-l10n-args');
    setTextContent(element, '');
    return;
  }

  element.setAttribute('data-l10n-id', id);
  if (args && typeof args === 'object') {
    element.setAttribute('data-l10n-args', JSON.stringify(args));
  } else {
    element.removeAttribute('data-l10n-args');
  }
}

function translateElement(element) {
  if (!this.ctx.isReady) {
    if (!pendingElements) {
      pendingElements = [];
    }
    pendingElements.push(element);
    return;
  }

  var l10n = getL10nAttributes(element);

  if (!l10n.id) {
    return false;
  }

  var entity = this.ctx.getEntity(l10n.id, l10n.args);

  if (!entity) {
    return false;
  }

  if (typeof entity === 'string') {
    setTextContent(element, entity);
    return true;
  }

  if (entity.value) {
    setTextContent(element, entity.value);
  }

  for (var key in entity.attributes) {
    var attr = entity.attributes[key];
    if (key === 'ariaLabel') {
      element.setAttribute('aria-label', attr);
    } else if (key === 'innerHTML') {
      // XXX: to be removed once bug 994357 lands
      element.innerHTML = attr;
    } else {
      element.setAttribute(key, attr);
    }
  }

  return true;
}

function setTextContent(element, text) {
  // standard case: no element children
  if (!element.firstElementChild) {
    element.textContent = text;
    return;
  }

  // this element has element children: replace the content of the first
  // (non-blank) child textNode and clear other child textNodes
  var found = false;
  var reNotBlank = /\S/;
  for (var child = element.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === Node.TEXT_NODE &&
        reNotBlank.test(child.nodeValue)) {
      if (found) {
        child.nodeValue = '';
      } else {
        child.nodeValue = text;
        found = true;
      }
    }
  }
  // if no (non-empty) textNode is found, insert a textNode before the
  // element's first child.
  if (!found) {
    element.insertBefore(document.createTextNode(text), element.firstChild);
  }
}
