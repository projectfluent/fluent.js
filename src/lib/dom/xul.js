import { Localization } from './base';
import { overlayElement } from './overlay';

export { contexts } from './base';

const ns = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

const allowed = {
  attributes: {
    global: [
      'accesskey', 'aria-label', 'aria-valuetext', 'aria-moz-hint', 'label'
    ],
    key: ['key', 'keycode'],
    textbox: ['placeholder'],
    toolbarbutton: ['tooltiptext'],
  }
};

/**
 * The XUL-specific Localization class.
 *
 * @extends Localization
 *
 */
export class XULLocalization extends Localization {
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
   * Always returns `false` for XUL elements.
   *
   * @returns {boolean}
   */
  isElementAllowed() {
    return false;
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
    // Bail if it isn't even a XUL element.
    if (element.namespaceURI !== ns) {
      return false;
    }

    const tagName = element.localName;
    const attrName = attr.name;

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

    return false;
  }
}
