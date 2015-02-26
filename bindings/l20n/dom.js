'use strict';

/* jshint -W104 */
/* global pendingElements:true, L10nError */
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

var allowedHtmlAttrs = {
  'ariaLabel': 'aria-label',
  'ariaValueText': 'aria-valuetext',
  'ariaMozHint': 'aria-moz-hint',
  'label': 'label',
  'placeholder': 'placeholder',
  'title': 'title'
};

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

  if (typeof entity.value === 'string') {
    setTextContent.call(this, l10n.id, element, entity.value);
  }

  for (var key in entity.attrs) {
    var attr = entity.attrs[key];
    if (allowedHtmlAttrs.hasOwnProperty(key)) {
      element.setAttribute(allowedHtmlAttrs[key], attr);
    } else if (key === 'innerHTML') {
      // XXX: to be removed once bug 994357 lands
      element.innerHTML = attr;
    }
  }

  return true;
}

function setTextContent(id, element, text) {
  if (element.firstElementChild) {
    throw new L10nError(
      'setTextContent is deprecated (https://bugzil.la/1053629). ' +
      'Setting text content of elements with child elements is no longer ' +
      'supported by l10n.js. Offending data-l10n-id: "' + id +
      '" on element ' + element.outerHTML + ' in ' + this.ctx.id);
  }

  element.textContent = text;
}
