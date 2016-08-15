// match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reOverlay = /<|&#?\w+;/;

export function overlayElement(l10n, element, translation) {
  const value = translation.value;

  if (typeof value === 'string') {
    if (!reOverlay.test(value)) {
      element.textContent = value;
    } else {
      // start with an inert template element and move its children into
      // `element` but such that `element`'s own children are not replaced
      const tmpl = element.ownerDocument.createElementNS(
        'http://www.w3.org/1999/xhtml', 'template');
      tmpl.innerHTML = value;
      // overlay the node with the DocumentFragment
      overlay(l10n, element, tmpl.content);
    }
  }

  for (let key in translation.attrs) {
    if (l10n.isAttrAllowed({ name: key }, element)) {
      element.setAttribute(key, translation.attrs[key]);
    }
  }
}

// The goal of overlay is to move the children of `translationElement`
// into `sourceElement` such that `sourceElement`'s own children are not
// replaced, but only have their text nodes and their attributes modified.
//
// We want to make it possible for localizers to apply text-level semantics to
// the translations and make use of HTML entities. At the same time, we
// don't trust translations so we need to filter unsafe elements and
// attributes out and we don't want to break the Web by replacing elements to
// which third-party code might have created references (e.g. two-way
// bindings in MVC frameworks).
function overlay(l10n, sourceElement, translationElement) {
  const result = translationElement.ownerDocument.createDocumentFragment();
  let k, attr;

  // take one node from translationElement at a time and check it against
  // the allowed list or try to match it with a corresponding element
  // in the source
  let childElement;
  while ((childElement = translationElement.childNodes[0])) {
    translationElement.removeChild(childElement);

    if (childElement.nodeType === childElement.TEXT_NODE) {
      result.appendChild(childElement);
      continue;
    }

    const index = getIndexOfType(childElement);
    const sourceChild = getNthElementOfType(sourceElement, childElement, index);
    if (sourceChild) {
      // there is a corresponding element in the source, let's use it
      overlay(l10n, sourceChild, childElement);
      result.appendChild(sourceChild);
      continue;
    }

    if (l10n.isElementAllowed(childElement)) {
      const sanitizedChild = childElement.ownerDocument.createElement(
        childElement.nodeName);
      overlay(l10n, sanitizedChild, childElement);
      result.appendChild(sanitizedChild);
      continue;
    }

    // otherwise just take this child's textContent
    result.appendChild(
      translationElement.ownerDocument.createTextNode(
        childElement.textContent));
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
      if (l10n.isAttrAllowed(attr, sourceElement)) {
        sourceElement.setAttribute(attr.name, attr.value);
      }
    }
  }
}

// Get n-th immediate child of context that is of the same type as element.
// XXX Use querySelector(':scope > ELEMENT:nth-of-type(index)'), when:
// 1) :scope is widely supported in more browsers and 2) it works with
// DocumentFragments.
function getNthElementOfType(context, element, index) {
  /* jshint boss:true */
  let nthOfType = 0;
  for (let i = 0, child; (child = context.children[i]); i++) {
    if (child.nodeType === child.ELEMENT_NODE &&
        child.tagName.toLowerCase() === element.tagName.toLowerCase()) {
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
  let index = 0;
  let child;
  while ((child = element.previousElementSibling)) {
    if (child.tagName === element.tagName) {
      index++;
    }
  }
  return index;
}
