/* eslint-env browser */

import { cloneElement, Children } from "react";
import VOID_ELEMENTS from "../vendor/voidElementTags";

// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reMarkup = /<|&#?\w+;/;

const TEMPLATE = document.createElement("template");

export function parseMarkup(str) {
  TEMPLATE.innerHTML = str;
  return TEMPLATE.content;
}

export default function Overlay({children, value, attrs, args}) {
  const elem = Children.only(children);

  // If the wrapped component is a known void element, explicitly dismiss the
  // message value and do not pass it to cloneElement in order to avoid the
  // "void element tags must neither have `children` nor use
  // `dangerouslySetInnerHTML`" error.
  if (elem.type in VOID_ELEMENTS) {
    return cloneElement(elem, attrs);
  }

  // If the message has a null value, we're only interested in its attributes.
  // Do not pass the null value to cloneElement as it would nuke all children
  // of the wrapped component.
  if (value === null) {
    return cloneElement(elem, attrs);
  }

  // If the message value doesn't contain any markup nor any HTML entities,
  // insert it as the only child of the wrapped component.
  if (!reMarkup.test(value)) {
    return cloneElement(elem, attrs, value);
  }

  // If the message contains markup, parse it and try to match the children
  // found in the translation with the props passed to this Localized.
  const translationNodes = Array.from(parseMarkup(value).childNodes);
  const translatedChildren = translationNodes.map(childNode => {
    if (childNode.nodeType === childNode.TEXT_NODE) {
      return childNode.textContent;
    }

    // If the child is not expected just take its textContent.
    if (!args.hasOwnProperty(childNode.localName)) {
      return childNode.textContent;
    }

    const sourceChild = args[childNode.localName];

    // If the element passed as a prop to <Localized> is a known void element,
    // explicitly dismiss any textContent which might have accidentally been
    // defined in the translation to prevent the "void element tags must not
    // have children" error.
    if (sourceChild.type in VOID_ELEMENTS) {
      return sourceChild;
    }

    // TODO Protect contents of elements wrapped in <Localized>
    // https://github.com/projectfluent/fluent.js/issues/184
    // TODO  Control localizable attributes on elements passed as props
    // https://github.com/projectfluent/fluent.js/issues/185
    return cloneElement(sourceChild, null, childNode.textContent);
  });

  return cloneElement(elem, attrs, ...translatedChildren);
}
