'use strict';

/* global allowed, pendingElements:true */
/* exported translateFragment, translateDocument */
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

function camelCaseToDashed(string) {
  // XXX workaround for https://bugzil.la/1141934
  if (string === 'ariaValueText') {
    return 'aria-valuetext';
  }

  return string
    .replace(/[A-Z]/g, function (match) {
      return '-' + match.toLowerCase();
    })
    .replace(/^-/, '');
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

  var value;
  if (entity.attrs && entity.attrs.innerHTML) {
    // XXX innerHTML is treated as value (https://bugzil.la/1142526)
    value = entity.attrs.innerHTML;
    console.warn(
      'L10n Deprecation Warning: using innerHTML in translations is unsafe ' +
      'and will not be supported in future versions of l10n.js. ' +
      'See https://bugzil.la/1027117');
  } else {
    value = entity.value;
  }

  if (typeof value === 'string') {
    if (!entity.overlay) {
      element.textContent = value;
    } else {
      // start with an inert template element and move its children into
      // `element` but such that `element`'s own children are not replaced
      var translation = element.ownerDocument.createElement('template');
      translation.innerHTML = value;
      // overlay the node with the DocumentFragment
      overlayElement(element, translation.content);
    }
  }

  for (var key in entity.attrs) {
    var attrName = camelCaseToDashed(key);
    if (isAttrAllowed({ name: attrName }, element)) {
      element.setAttribute(attrName, entity.attrs[key]);
    }
  }
}

// The goal of overlayElement is to move the children of `translationElement`
// into `sourceElement` such that `sourceElement`'s own children are not
// replaced, but onle have their text nodes and their attributes modified.
//
// We want to make it possible for localizers to apply text-level semantics to
// the translations and make use of HTML entities. At the same time, we
// don't trust translations so we need to filter unsafe elements and
// attribtues out and we don't want to break the Web by replacing elements to
// which third-party code might have created references (e.g. two-way
// bindings in MVC frameworks).
function overlayElement(sourceElement, translationElement) {
  var result = translationElement.ownerDocument.createDocumentFragment();
  var k, attr;

  // take one node from translationElement at a time and check it against
  // the allowed list or try to match it with a corresponding element
  // in the source
  var childElement;
  while ((childElement = translationElement.childNodes[0])) {
    translationElement.removeChild(childElement);

    if (childElement.nodeType === Node.TEXT_NODE) {
      result.appendChild(childElement);
      continue;
    }

    var index = getIndexOfType(childElement);
    var sourceChild = getNthElementOfType(sourceElement, childElement, index);
    if (sourceChild) {
      // there is a corresponding element in the source, let's use it
      overlayElement(sourceChild, childElement);
      result.appendChild(sourceChild);
      continue;
    }

    if (isElementAllowed(childElement)) {
      for (k = 0, attr; (attr = childElement.attributes[k]); k++) {
        if (!isAttrAllowed(attr, childElement)) {
          childElement.removeAttribute(attr.name);
        }
      }
      result.appendChild(childElement);
      continue;
    }

    // otherwise just take this child's textContent
    result.appendChild(
      document.createTextNode(childElement.textContent));
  }

  // clear `sourceElement` and append `result` which by this time contains
  // `sourceElement`'s original children, overlayed with translation
  sourceElement.textContent = '';
  sourceElement.appendChild(result);

  // if we're overlaying a nested element, translate the allowed
  // attributes; top-level attributes are handled in `translateElement`
  // XXX attributes previously set here for another language should be
  // cleared if a new language doesn't use them; https://bugzil.la/922577
  if (translationElement.attributes) {
    for (k = 0, attr; (attr = translationElement.attributes[k]); k++) {
      if (isAttrAllowed(attr, sourceElement)) {
        sourceElement.setAttribute(attr.name, attr.value);
      }
    }
  }
}

// XXX the allowed list should be amendable; https://bugzil.la/922573
function isElementAllowed(element) {
  return allowed.elements.indexOf(element.tagName.toLowerCase()) !== -1;
}

function isAttrAllowed(attr, element) {
  var attrName = attr.name.toLowerCase();
  var tagName = element.tagName.toLowerCase();
  // is it a globally safe attribute?
  if (allowed.attributes.global.indexOf(attrName) !== -1) {
    return true;
  }
  // are there no allowed attributes for this element?
  if (!allowed.attributes[tagName]) {
    return false;
  }
  // is it allowed on this element?
  // XXX the allowed list should be amendable; https://bugzil.la/922573
  if (allowed.attributes[tagName].indexOf(attrName) !== -1) {
    return true;
  }
  // special case for value on inputs with type button, reset, submit
  if (tagName === 'input' && attrName === 'value') {
    var type = element.type.toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'reset') {
      return true;
    }
  }
  return false;
}

// Get n-th immediate child of context that is of the same type as element.
// XXX Use querySelector(':scope > ELEMENT:nth-of-type(index)'), when:
// 1) :scope is widely supported in more browsers and 2) it works with
// DocumentFragments.
function getNthElementOfType(context, element, index) {
  /* jshint boss:true */
  var nthOfType = 0;
  for (var i = 0, child; child = context.children[i]; i++) {
    if (child.nodeType === Node.ELEMENT_NODE &&
        child.tagName === element.tagName) {
      if (nthOfType === index) {
        return child;
      }
      nthOfType++;
    }
  }
  return null;
}

// Get the index of the element among siblings of the same type.
function getIndexOfType(element) {
  var index = 0;
  var child;
  while ((child = element.previousElementSibling)) {
    if (child.tagName === element.tagName) {
      index++;
    }
  }
  return index;
}
