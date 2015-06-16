'use strict';

const allowed = {
  elements: [
    'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data',
    'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u',
    'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr'
  ],
  attributes: {
    global: [ 'title', 'aria-label', 'aria-valuetext', 'aria-moz-hint' ],
    a: [ 'download' ],
    area: [ 'download', 'alt' ],
    // value is special-cased in isAttrAllowed
    input: [ 'alt', 'placeholder' ],
    menuitem: [ 'label' ],
    menu: [ 'label' ],
    optgroup: [ 'label' ],
    option: [ 'label' ],
    track: [ 'label' ],
    img: [ 'alt' ],
    textarea: [ 'placeholder' ],
    th: [ 'abbr']
  }
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
  var nodes = [];

  if (typeof element.hasAttribute === 'function' &&
      element.hasAttribute('data-l10n-id')) {
    nodes.push(element);
  }

  return nodes.concat.apply(
    nodes, element.querySelectorAll('*[data-l10n-id]'));
}

export function translateDocument(view, langs, doc) {
  let setDOMLocalized = function() {
    doc.localized = true;
    dispatchEvent(doc, 'DOMLocalized', langs);
  };

  if (langs[0].code === doc.documentElement.getAttribute('lang')) {
    return Promise.resolve(setDOMLocalized());
  }

  return translateFragment(view, langs, doc.documentElement).then(
    () => {
      doc.documentElement.lang = langs[0].code;
      doc.documentElement.dir = langs[0].dir;
      setDOMLocalized();
    });
}

export function translateMutations(view, langs, mutations) {
  let targets = new Set();

  for (let mutation of mutations) {
    switch (mutation.type) {
      case 'attributes':
        targets.add(mutation.target);
        break;
      case 'childList':
        for (let addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            targets.add(addedNode);
          }
        }
        break;
    }
  }

  if (targets.size === 0) {
    return;
  }

  let elements = [];

  targets.forEach(target => target.childElementCount ?
      elements.concat(getTranslatables(target)) : elements.push(target));

  Promise.all(
    elements.map(elem => getElementTranslation(view, langs, elem))).then(
      translations => applyTranslations(view, elements, translations));
}

export function translateFragment(view, langs, frag) {
  let elements = getTranslatables(frag);
  return Promise.all(
    elements.map(elem => getElementTranslation(view, langs, elem))).then(
      translations => applyTranslations(view, elements, translations));
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

function getElementTranslation(view, langs, elem) {
  var l10n = getAttributes(elem);

  return l10n.id ?
    view.ctx.formatEntity(langs, l10n.id, l10n.args) : false;
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

function applyTranslations(view, elements, translations) {
  view.disconnect();
  for (let i = 0; i < elements.length; i++) {
    if (translations[i] === false) {
      continue;
    }
    applyTranslation(view, elements[i], translations[i]);
  }
  view.observe();
}

function applyTranslation(view, element, translation) {
  var value;
  if (translation.attrs && translation.attrs.innerHTML) {
    // XXX innerHTML is treated as value (https://bugzil.la/1142526)
    value = translation.attrs.innerHTML;
    console.warn(
      'L10n Deprecation Warning: using innerHTML in translations is unsafe ' +
      'and will not be supported in future versions of l10n.js. ' +
      'See https://bugzil.la/1027117');
  } else {
    value = translation.value;
  }

  if (typeof value === 'string') {
    if (!translation.overlay) {
      element.textContent = value;
    } else {
      // start with an inert template element and move its children into
      // `element` but such that `element`'s own children are not replaced
      var tmpl = element.ownerDocument.createElement('template');
      tmpl.innerHTML = value;
      // overlay the node with the DocumentFragment
      overlayElement(element, tmpl.content);
    }
  }

  for (var key in translation.attrs) {
    var attrName = camelCaseToDashed(key);
    if (isAttrAllowed({ name: attrName }, element)) {
      element.setAttribute(attrName, translation.attrs[key]);
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

export function dispatchEvent(root, name, langs) {
  var event = new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: {
      languages: langs
    }
  });
  root.dispatchEvent(event);
}
