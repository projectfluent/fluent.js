import { Localization } from './base';
import { overlayElement } from './overlay';

export { contexts } from './base';

const allowed = {
  attributes: {
    global: ['aria-label', 'aria-valuetext', 'aria-moz-hint'],
    button: ['accesskey'],
    tab: ['label'],
    textbox: ['placeholder'],
  }
};

export class XULLocalization extends Localization {
  overlayElement(element, translation) {
    return overlayElement(this, element, translation);
  }

  isElementAllowed(element) {
    return false;
  }

  isAttrAllowed(attr, element) {
    const attrName = attr.name.toLowerCase();
    const tagName = element.tagName.toLowerCase();
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
    return false;
  }
}
