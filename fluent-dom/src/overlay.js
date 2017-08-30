// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reOverlay = /<|&#?\w+;/;

/**
 * The list of elements that are allowed to be inserted into a localization.
 *
 * Source: https://www.w3.org/TR/html5/text-level-semantics.html
 */
const ALLOWED_ELEMENTS = {
  'http://www.w3.org/1999/xhtml': [
    'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data',
    'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u',
    'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr'
  ],
};

const ALLOWED_ATTRIBUTES = {
  'http://www.w3.org/1999/xhtml': {
    global: ['title', 'aria-label', 'aria-valuetext', 'aria-moz-hint'],
    a: ['download'],
    area: ['download', 'alt'],
    // value is special-cased in isAttrNameAllowed
    input: ['alt', 'placeholder'],
    menuitem: ['label'],
    menu: ['label'],
    optgroup: ['label'],
    option: ['label'],
    track: ['label'],
    img: ['alt'],
    textarea: ['placeholder'],
    th: ['abbr']
  },
  'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul': {
    global: [
      'accesskey', 'aria-label', 'aria-valuetext', 'aria-moz-hint', 'label'
    ],
    key: ['key', 'keycode'],
    textbox: ['placeholder'],
    toolbarbutton: ['tooltiptext'],
  }
};


/**
 * Overlay translation onto a DOM element.
 *
 * @param   {Element}      element
 * @param   {string}       translation
 * @private
 */
export default function overlayElement(element, translation) {
  const value = translation.value;

  if (typeof value === 'string') {
    if (!reOverlay.test(value)) {
      // If the translation doesn't contain any markup skip the overlay logic.
      element.textContent = value;
    } else {
      // Else start with an inert template element and move its children into
      // `element` but such that `element`'s own children are not replaced.
      const tmpl = element.ownerDocument.createElementNS(
        'http://www.w3.org/1999/xhtml', 'template');
      tmpl.innerHTML = value;
      // Overlay the node with the DocumentFragment.
      overlay(element, tmpl.content);
    }
  }

  if (translation.attrs === null) {
    return;
  }

  const explicitlyAllowed = element.hasAttribute('data-l10n-attrs')
    ? element.getAttribute('data-l10n-attrs').split(',').map(i => i.trim())
    : null;

  for (const [name, val] of translation.attrs) {
    if (isAttrNameAllowed(name, element, explicitlyAllowed)) {
      element.setAttribute(name, val);
    }
  }
}

/**
 * The goal of overlay is to move the children of `translationElement`
 * into `sourceElement` such that `sourceElement`'s own children are not
 * replaced, but only have their text nodes and their attributes modified.
 *
 * We want to make it possible for localizers to apply text-level semantics to
 * the translations and make use of HTML entities. At the same time, we
 * don't trust translations so we need to filter unsafe elements and
 * attributes out and we don't want to break the Web by replacing elements to
 * which third-party code might have created references (e.g. two-way
 * bindings in MVC frameworks).
 *
 * @param {Element} sourceElement
 * @param {Element} translationElement
 * @private
 */
function overlay(sourceElement, translationElement) {
  const result = translationElement.ownerDocument.createDocumentFragment();

  // Take one node from translationElement at a time and check it against
  // the allowed list or try to match it with a corresponding element
  // in the source.
  let childNode;
  while ((childNode = translationElement.childNodes[0])) {
    translationElement.removeChild(childNode);

    if (childNode.nodeType === childNode.TEXT_NODE) {
      result.appendChild(childNode);
      continue;
    }

    const sourceChild = getElementOfType(sourceElement, childNode.localName);
    if (sourceChild) {
      // There is a corresponding element in the source, let's use it.
      sourceElement.removeChild(sourceChild);
      overlay(sourceChild, childNode);
      result.appendChild(sourceChild);
      continue;
    }

    if (isElementAllowed(childNode)) {
      const sanitizedChild = childNode.ownerDocument.createElement(
        childNode.localName);
      overlay(sanitizedChild, childNode);
      result.appendChild(sanitizedChild);
      continue;
    }

    // Otherwise just take this child's textContent.
    result.appendChild(
      translationElement.ownerDocument.createTextNode(
        childNode.textContent));
  }

  // Clear `sourceElement` and append `result` which by this time contains
  // `sourceElement`'s original children, overlayed with translation.
  sourceElement.textContent = '';
  sourceElement.appendChild(result);

  // If we're overlaying a nested element, translate the allowed
  // attributes; top-level attributes are handled in `overlayElement`.
  // XXX Attributes previously set here for another language should be
  // cleared if a new language doesn't use them; https://bugzil.la/922577
  if (translationElement.attributes) {
    for (const attr of Array.from(translationElement.attributes)) {
      if (isAttrNameAllowed(attr.name, sourceElement)) {
        sourceElement.setAttribute(attr.name, attr.value);
      }
    }
  }
}

/**
 * Check if element is allowed in the translation.
 *
 * This method is used by the sanitizer when the translation markup contains
 * an element which is not present in the source code.
 *
 * @param   {Element} element
 * @returns {boolean}
 * @private
 */
function isElementAllowed(element) {
  const allowed = ALLOWED_ELEMENTS[element.namespaceURI];
  return allowed && allowed.includes(element.localName);
}

/**
 * Check if attribute is allowed for the given element.
 *
 * This method is used by the sanitizer when the translation markup contains
 * DOM attributes, or when the translation has traits which map to DOM
 * attributes.
 *
 * `explicitlyAllowed` can be passed as a list of attributes explicitly
 * allowed on this element.
 *
 * @param   {string}         name
 * @param   {Element}        element
 * @param   {Array}          explicitlyAllowed
 * @returns {boolean}
 * @private
 */
function isAttrNameAllowed(name, element, explicitlyAllowed = null) {
  if (explicitlyAllowed && explicitlyAllowed.includes(name)) {
    return true;
  }

  const allowed = ALLOWED_ATTRIBUTES[element.namespaceURI];
  if (!allowed) {
    return false;
  }

  const attrName = name.toLowerCase();
  const elemName = element.localName;

  // Is it a globally safe attribute?
  if (allowed.global.includes(attrName)) {
    return true;
  }

  // Are there no allowed attributes for this element?
  if (!allowed[elemName]) {
    return false;
  }

  // Is it allowed on this element?
  if (allowed[elemName].includes(attrName)) {
    return true;
  }

  // Special case for value on HTML inputs with type button, reset, submit
  if (element.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
      elemName === 'input' && attrName === 'value') {
    const type = element.type.toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'reset') {
      return true;
    }
  }

  return false;
}

/**
 * Get the first child of context of the given type.
 *
 * @param {DOMFragment} context
 * @param {string}      localName
 * @returns {Element | null}
 * @private
 */
function getElementOfType(context, localName) {
  for (const child of context.children) {
    if (child.nodeType === child.ELEMENT_NODE &&
        child.localName === localName) {
      return child;
    }
  }
  return null;
}
