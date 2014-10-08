'use strict';

/* jshint -W104 */
/* global Promise */
/* exported translateFragment, translateDocument */
/* exported setL10nAttributes, getL10nAttributes */

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

function getTranslatables(element) {
  var nodes = [];

  if (element.hasAttribute('data-l10n-id')) {
    nodes.push(element);
  }

  return nodes.concat.apply(
    nodes, element.querySelectorAll('*[data-l10n-id]'));
}

function translateFragment(element) {
  return Promise.all(
    getTranslatables(element).map(
      translateElement.bind(this)));
}

function translateElement(element) {
  var l10n = getL10nAttributes(element);

  if (!l10n.id) {
    return false;
  }

  return this.ctx.formatEntity(l10n.id, l10n.args).then(function(entity) {
    this.observer.stop();

    if (typeof entity === 'string') {
      setTextContent(element, entity);
    } else if (entity.value) {
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

    this.observer.start();
  }.bind(this));
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
