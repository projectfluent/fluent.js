import { Localization } from './base';
import { overlayElement } from './overlay';

export { contexts } from './base';

const ns = 'http://www.w3.org/1999/xhtml';

const allowed = {
  elements: [
    'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data',
    'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u',
    'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr'
  ],
  attributes: {
    global: ['title', 'aria-label', 'aria-valuetext', 'aria-moz-hint'],
    a: ['download'],
    area: ['download', 'alt'],
    // value is special-cased in isAttrAllowed
    input: ['alt', 'placeholder'],
    menuitem: ['label'],
    menu: ['label'],
    optgroup: ['label'],
    option: ['label'],
    track: ['label'],
    img: ['alt'],
    textarea: ['placeholder'],
    th: ['abbr']
  }
};

/**
 * The HTML-specific Localization class.
 *
 * @extends Localization
 *
 */
export class HTMLLocalization extends Localization {
  /**
   * Overlay a DOM element using markup from a translation.
   *
   * @param {Element} element
   * @param {string}  translation
   */
  overlayElement(element, translation) {
    return overlayElement(this, element, translation);
  }

  /**
   * Check if element is allowed in this `Localization`'s document namespace.
   *
   * This method is used by the sanitizer when the translation markup contains
   * an element which is not present in the source code.
   *
   * @param   {Element} element
   * @returns {boolean}
   */
  isElementAllowed(element) {
    // XXX The allowed list should be amendable; https://bugzil.la/922573.
    return allowed.elements.indexOf(element.tagName.toLowerCase()) !== -1;
  }

  /**
   * Check if attribute is allowed for the given element.
   *
   * This method is used by the sanitizer when the translation markup contains
   * DOM attributes, or when the translation has traits which map to DOM
   * attributes.
   *
   * @param   {{name: string}} attr
   * @param   {Element}        element
   * @returns {boolean}
   */
  isAttrAllowed(attr, element) {
    // Bail if it isn't even an HTML element.
    if (element.namespaceURI !== ns) {
      return false;
    }

    const attrName = attr.name.toLowerCase();
    const tagName = element.tagName.toLowerCase();

    // Is it a globally safe attribute?
    if (allowed.attributes.global.indexOf(attrName) !== -1) {
      return true;
    }

    // Are there no allowed attributes for this element?
    if (!allowed.attributes[tagName]) {
      return false;
    }

    // Is it allowed on this element?
    // XXX The allowed list should be amendable; https://bugzil.la/922573
    if (allowed.attributes[tagName].indexOf(attrName) !== -1) {
      return true;
    }

    // Special case for value on inputs with type button, reset, submit
    if (tagName === 'input' && attrName === 'value') {
      const type = element.type.toLowerCase();
      if (type === 'submit' || type === 'button' || type === 'reset') {
        return true;
      }
    }

    return false;
  }

}
