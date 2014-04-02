'use strict';

/* jshint -W104 */
/* global ctx, getDirection */
/* exported translateFragment, localizeElement */

function translateFragment(element, loc) {
  if (!element) {
    element = document.documentElement;
    var lang = loc ? loc.id : ctx.supportedLocales[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = getDirection(lang);
  }
  translateElement(element, loc);

  for (var node of getTranslatableChildren(element)) {
    translateElement(node, loc);
  }
}

function getTranslatableChildren(element) {
  return element ? element.querySelectorAll('*[data-l10n-id]') : [];
}

function localizeElement(element, id, args) {
  if (!element) {
    return;
  }

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

  if (ctx.isReady) {
    translateElement(element);
  }
}

function getL10nAttributes(element) {
  if (!element) {
    return {};
  }

  var l10nId = element.getAttribute('data-l10n-id');
  var l10nArgs = element.getAttribute('data-l10n-args');

  var args = l10nArgs ? JSON.parse(l10nArgs) : null;

  return {id: l10nId, args: args};
}



function translateElement(element, loc) {
  var l10n = getL10nAttributes(element);

  if (!l10n.id) {
    return;
  }

  var entity;
  if (loc) {
    entity = loc.getEntity(l10n.id, l10n.args);
  } else {
    entity = ctx.getEntity(l10n.id, l10n.args);
  }

  if (!entity) {
    return;
  }

  if (typeof entity === 'string') {
    setTextContent(element, entity);
    return true;
  }

  if (entity.value) {
    setTextContent(element, entity.value);
  }

  for (var key in entity.attributes) {
    if (entity.attributes.hasOwnProperty(key)) {
      var attr = entity.attributes[key];
      var pos = key.indexOf('.');
      if (pos !== -1) {
        element[key.substr(0, pos)][key.substr(pos + 1)] = attr;
      } else if (key === 'ariaLabel') {
        element.setAttribute('aria-label', attr);
      } else {
        element[key] = attr;
      }
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
