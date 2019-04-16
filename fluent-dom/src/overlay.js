/* eslint no-console: ["error", {allow: ["warn"]}] */
/* global console */

// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reOverlay = /<|&#?\w+;/;

/**
 * Elements allowed in translations even if they are not present in the source
 * HTML. They are text-level elements as defined by the HTML5 spec:
 * https://www.w3.org/TR/html5/text-level-semantics.html with the exception of:
 *
 *   - a - because we don't allow href on it anyways,
 *   - ruby, rt, rp - because we don't allow nested elements to be inserted.
 */
const TEXT_LEVEL_ELEMENTS = {
  "http://www.w3.org/1999/xhtml": [
    "em", "strong", "small", "s", "cite", "q", "dfn", "abbr", "data",
    "time", "code", "var", "samp", "kbd", "sub", "sup", "i", "b", "u",
    "mark", "bdi", "bdo", "span", "br", "wbr"
  ],
};

const LOCALIZABLE_ATTRIBUTES = {
  "http://www.w3.org/1999/xhtml": {
    global: ["title", "aria-label", "aria-valuetext"],
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
      "accesskey", "aria-label", "aria-valuetext", "label",
      "title", "tooltiptext"
    ],
    description: ["value"],
    key: ["key", "keycode"],
    label: ["value"],
    textbox: ["placeholder", "value"],
  }
};


/**
 * Translate an element.
 *
 * Translate the element's text content and attributes. Some HTML markup is
 * allowed in the translation. The element's children with the data-l10n-name
 * attribute will be treated as arguments to the translation. If the
 * translation defines the same children, their attributes and text contents
 * will be used for translating the matching source child.
 *
 * @param   {Element} element
 * @param   {Object} translation
 * @private
 */
export default function translateElement(element, translation) {
  const {value} = translation;

  if (typeof value === "string") {
    if (!reOverlay.test(value)) {
      // If the translation doesn't contain any markup skip the overlay logic.
      element.textContent = value;
    } else {
      // Else parse the translation's HTML using an inert template element,
      // sanitize it and replace the element's content.
      const templateElement = element.ownerDocument.createElementNS(
        "http://www.w3.org/1999/xhtml", "template"
      );
      templateElement.innerHTML = value;
      overlayChildNodes(templateElement.content, element);
    }
  }

  // Even if the translation doesn't define any localizable attributes, run
  // overlayAttributes to remove any localizable attributes set by previous
  // translations.
  overlayAttributes(translation, element);
}

/**
 * Replace child nodes of an element with child nodes of another element.
 *
 * The contents of the target element will be cleared and fully replaced with
 * sanitized contents of the source element.
 *
 * @param {DocumentFragment} fromFragment - The source of children to overlay.
 * @param {Element} toElement - The target of the overlay.
 * @private
 */
function overlayChildNodes(fromFragment, toElement) {
  for (const childNode of fromFragment.childNodes) {
    if (childNode.nodeType === childNode.TEXT_NODE) {
      // Keep the translated text node.
      continue;
    }

    if (childNode.hasAttribute("data-l10n-name")) {
      const sanitized = getNodeForNamedElement(toElement, childNode);
      fromFragment.replaceChild(sanitized, childNode);
      continue;
    }

    if (isElementAllowed(childNode)) {
      const sanitized = createSanitizedElement(childNode);
      fromFragment.replaceChild(sanitized, childNode);
      continue;
    }

    console.warn(
      `An element of forbidden type "${childNode.localName}" was found in ` +
      "the translation. Only safe text-level elements and elements with " +
      "data-l10n-name are allowed."
    );

    // If all else fails, replace the element with its text content.
    fromFragment.replaceChild(createTextNodeFromTextContent(childNode), childNode);
  }

  toElement.textContent = "";
  toElement.appendChild(fromFragment);
}

function hasAttribute(attributes, name) {
  if (!attributes) {
    return false;
  }
  for (let attr of attributes) {
    if (attr.name === name) {
      return true;
    }
  }
  return false;
}

/**
 * Transplant localizable attributes of an element to another element.
 *
 * Any localizable attributes already set on the target element will be
 * cleared.
 *
 * @param   {Element|Object} fromElement - The source of child nodes to overlay.
 * @param   {Element} toElement - The target of the overlay.
 * @private
 */
function overlayAttributes(fromElement, toElement) {
  const explicitlyAllowed = toElement.hasAttribute("data-l10n-attrs")
    ? toElement.getAttribute("data-l10n-attrs")
      .split(",").map(i => i.trim())
    : null;

  // Remove existing localizable attributes if they
  // will not be used in the new translation.
  for (const attr of Array.from(toElement.attributes)) {
    if (isAttrNameLocalizable(attr.name, toElement, explicitlyAllowed)
      && !hasAttribute(fromElement.attributes, attr.name)) {
      toElement.removeAttribute(attr.name);
    }
  }

  // fromElement might be a {value, attributes} object as returned by
  // Localization.messageFromBundle. In which case attributes may be null to
  // save GC cycles.
  if (!fromElement.attributes) {
    return;
  }

  // Set localizable attributes.
  for (const attr of Array.from(fromElement.attributes)) {
    if (isAttrNameLocalizable(attr.name, toElement, explicitlyAllowed)
      && toElement.getAttribute(attr.name) !== attr.value) {
      toElement.setAttribute(attr.name, attr.value);
    }
  }
}

/**
 * Sanitize a child element created by the translation.
 *
 * Try to find a corresponding child in sourceElement and use it as the base
 * for the sanitization. This will preserve functional attribtues defined on
 * the child element in the source HTML.
 *
 * @param   {Element} sourceElement - The source for data-l10n-name lookups.
 * @param   {Element} translatedChild - The translated child to be sanitized.
 * @returns {Element}
 * @private
 */
function getNodeForNamedElement(sourceElement, translatedChild) {
  const childName = translatedChild.getAttribute("data-l10n-name");
  const sourceChild = sourceElement.querySelector(
    `[data-l10n-name="${childName}"]`
  );

  if (!sourceChild) {
    console.warn(
      `An element named "${childName}" wasn't found in the source.`
    );
    return createTextNodeFromTextContent(translatedChild);
  }

  if (sourceChild.localName !== translatedChild.localName) {
    console.warn(
      `An element named "${childName}" was found in the translation ` +
      `but its type ${translatedChild.localName} didn't match the ` +
      `element found in the source (${sourceChild.localName}).`
    );
    return createTextNodeFromTextContent(translatedChild);
  }

  // Remove it from sourceElement so that the translation cannot use
  // the same reference name again.
  sourceElement.removeChild(sourceChild);
  // We can't currently guarantee that a translation won't remove
  // sourceChild from the element completely, which could break the app if
  // it relies on an event handler attached to the sourceChild. Let's make
  // this limitation explicit for now by breaking the identitiy of the
  // sourceChild by cloning it. This will destroy all event handlers
  // attached to sourceChild via addEventListener and via on<name>
  // properties.
  const clone = sourceChild.cloneNode(false);
  return shallowPopulateUsing(translatedChild, clone);
}

/**
 * Sanitize an allowed element.
 *
 * Text-level elements allowed in translations may only use safe attributes
 * and will have any nested markup stripped to text content.
 *
 * @param   {Element} element - The element to be sanitized.
 * @returns {Element}
 * @private
 */
function createSanitizedElement(element) {
  // Start with an empty element of the same type to remove nested children
  // and non-localizable attributes defined by the translation.
  const clone = element.ownerDocument.createElement(element.localName);
  return shallowPopulateUsing(element, clone);
}

/**
 * Convert an element to a text node.
 *
 * @param   {Element} element - The element to be sanitized.
 * @returns {Node}
 * @private
 */
function createTextNodeFromTextContent(element) {
  return element.ownerDocument.createTextNode(element.textContent);
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
  const allowed = TEXT_LEVEL_ELEMENTS[element.namespaceURI];
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
 * Helper to set textContent and localizable attributes on an element.
 *
 * @param   {Element} fromElement
 * @param   {Element} toElement
 * @returns {Element}
 * @private
 */
function shallowPopulateUsing(fromElement, toElement) {
  toElement.textContent = fromElement.textContent;
  overlayAttributes(fromElement, toElement);
  return toElement;
}
