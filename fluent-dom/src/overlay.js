// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reOverlay = /<|&#?\w+;/;

/**
 * The list of elements that are allowed to be inserted into a localization.
 *
 * Source: https://www.w3.org/TR/html5/text-level-semantics.html
 */
const LOCALIZABLE_ELEMENTS = {
  "http://www.w3.org/1999/xhtml": [
    "a", "em", "strong", "small", "s", "cite", "q", "dfn", "abbr", "data",
    "time", "code", "var", "samp", "kbd", "sub", "sup", "i", "b", "u",
    "mark", "ruby", "rt", "rp", "bdi", "bdo", "span", "br", "wbr"
  ],
};

const LOCALIZABLE_ATTRIBUTES = {
  "http://www.w3.org/1999/xhtml": {
    global: ["title", "aria-label", "aria-valuetext", "aria-moz-hint"],
    a: ["download"],
    area: ["download", "alt"],
    // value is special-cased in isAttrNameLocalizable
    input: ["alt", "placeholder"],
    menuitem: ["label"],
    menu: ["label"],
    optgroup: ["label"],
    option: ["label"],
    track: ["label"],
    img: ["alt"],
    textarea: ["placeholder"],
    th: ["abbr"]
  },
  "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul": {
    global: [
      "accesskey", "aria-label", "aria-valuetext", "aria-moz-hint", "label"
    ],
    key: ["key", "keycode"],
    textbox: ["placeholder"],
    toolbarbutton: ["tooltiptext"],
  }
};


/**
 * Overlay translation onto a DOM element.
 *
 * @param   {Element} targetElement
 * @param   {string|Object} translation
 * @private
 */
export default function overlayElement(targetElement, translation) {
  const value = translation.value;

  if (typeof value === "string") {
    if (!reOverlay.test(value)) {
      // If the translation doesn't contain any markup skip the overlay logic.
      targetElement.textContent = value;
    } else {
      // Else parse the translation's HTML using an inert template element,
      // sanitize it and replace the targetElement's content.
      const templateElement = targetElement.ownerDocument.createElementNS(
        "http://www.w3.org/1999/xhtml", "template");
      templateElement.innerHTML = value;
      targetElement.appendChild(
        // The targetElement will be cleared at the end of sanitization.
        sanitizeUsing(templateElement.content, targetElement)
      );
    }
  }

  const explicitlyAllowed = targetElement.hasAttribute("data-l10n-attrs")
    ? targetElement.getAttribute("data-l10n-attrs")
      .split(",").map(i => i.trim())
    : null;

  // Remove localizable attributes which may have been set by a previous
  // translation.
  for (const attr of Array.from(targetElement.attributes)) {
    if (isAttrNameLocalizable(attr.name, targetElement, explicitlyAllowed)) {
      targetElement.removeAttribute(attr.name);
    }
  }

  if (translation.attrs) {
    for (const {name: attrName, value: attrValue} of translation.attrs) {
      if (isAttrNameLocalizable(attrName, targetElement, explicitlyAllowed)) {
        targetElement.setAttribute(attrName, attrValue);
      }
    }
  }
}

/**
 * Sanitize `translationFragment` using `sourceElement` to add functional
 * HTML attributes to children.  `sourceElement` will have all its child nodes
 * removed.
 *
 * The sanitization is conducted according to the following rules:
 *
 *   - Allow text nodes.
 *   - Replace forbidden children with their textContent.
 *   - Remove forbidden attributes from allowed children.
 *
 * Additionally when a child of the same type is present in `sourceElement` its
 * attributes will be merged into the translated child.  Whitelisted attributes
 * of the translated child will then overwrite the ones present in the source.
 *
 * The overlay logic is subject to the following limitations:
 *
 *   - Children are always cloned.  Event handlers attached to them are lost.
 *   - Nested HTML in source and in translations is not supported.
 *   - Multiple children of the same type will be matched in order.
 *
 * @param {DocumentFragment} translationFragment
 * @param {Element} sourceElement
 * @returns {DocumentFragment}
 * @private
 */
function sanitizeUsing(translationFragment, sourceElement) {
  const ownerDocument = translationFragment.ownerDocument;
  // Take one node from translationFragment at a time and check it against
  // the allowed list or try to match it with a corresponding element
  // in the source.
  for (const childNode of translationFragment.childNodes) {

    if (childNode.nodeType === childNode.TEXT_NODE) {
      continue;
    }

    // If the child is forbidden just take its textContent.
    if (!isElementLocalizable(childNode)) {
      const text = ownerDocument.createTextNode(childNode.textContent);
      translationFragment.replaceChild(text, childNode);
      continue;
    }

    // Start the sanitization with an empty element.
    const mergedChild = ownerDocument.createElement(childNode.localName);

    // Explicitly discard nested HTML by serializing childNode to a TextNode.
    mergedChild.textContent = childNode.textContent;

    // If a child of the same type exists in sourceElement, take its functional
    // (i.e. non-localizable) attributes. This also removes the child from
    // sourceElement.
    const sourceChild = shiftNamedElement(sourceElement, childNode.localName);

    // Find the union of all safe attributes: localizable attributes from
    // childNode and functional attributes from sourceChild.
    const safeAttributes = sanitizeAttrsUsing(childNode, sourceChild);

    for (const attr of safeAttributes) {
      mergedChild.setAttribute(attr.name, attr.value);
    }

    translationFragment.replaceChild(mergedChild, childNode);
  }

  // SourceElement might have been already modified by shiftNamedElement.
  // Let's clear it to make sure other code doesn't rely on random leftovers.
  sourceElement.textContent = "";

  return translationFragment;
}

/**
 * Sanitize and merge attributes.
 *
 * Only localizable attributes from the translated child element and only
 * functional attributes from the source child element are considered safe.
 *
 * @param {Element} translatedElement
 * @param {Element} sourceElement
 * @returns {Array<Attr>}
 * @private
 */
function sanitizeAttrsUsing(translatedElement, sourceElement) {
  const localizedAttrs = Array.from(translatedElement.attributes).filter(
    attr => isAttrNameLocalizable(attr.name, translatedElement)
  );

  if (!sourceElement) {
    return localizedAttrs;
  }

  const functionalAttrs = Array.from(sourceElement.attributes).filter(
    attr => !isAttrNameLocalizable(attr.name, sourceElement)
  );

  return localizedAttrs.concat(functionalAttrs);
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
function isElementLocalizable(element) {
  const allowed = LOCALIZABLE_ELEMENTS[element.namespaceURI];
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
function isAttrNameLocalizable(name, element, explicitlyAllowed = null) {
  if (explicitlyAllowed && explicitlyAllowed.includes(name)) {
    return true;
  }

  const allowed = LOCALIZABLE_ATTRIBUTES[element.namespaceURI];
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
  if (element.namespaceURI === "http://www.w3.org/1999/xhtml" &&
      elemName === "input" && attrName === "value") {
    const type = element.type.toLowerCase();
    if (type === "submit" || type === "button" || type === "reset") {
      return true;
    }
  }

  return false;
}

/**
 * Remove and return the first child of the given type.
 *
 * @param {DOMFragment} element
 * @param {string}      localName
 * @returns {Element | null}
 * @private
 */
function shiftNamedElement(element, localName) {
  for (const child of element.children) {
    if (child.localName === localName) {
      element.removeChild(child);
      return child;
    }
  }
  return null;
}
