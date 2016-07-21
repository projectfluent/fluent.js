import { Localization } from './base';
import { overlayElement } from './overlay';

export { contexts } from './base';

const ns = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

const allowed = {
  attributes: {
    global: ['aria-label', 'aria-valuetext', 'aria-moz-hint'],
    button: ['accesskey'],
    key: ['key', 'keycode'],
    menu: ['label', 'accesskey'],
    menuitem: ['label', 'accesskey'],
    tab: ['label'],
    textbox: ['placeholder'],
    toolbarbutton: ['label', 'tooltiptext'],
  }
};

export class XULLocalization extends Localization {
  overlayElement(element, translation) {
    return overlayElement(this, element, translation);
  }

  isElementAllowed() {
    return false;
  }

  isAttrAllowed(attr, element) {
    if (element.namespaceURI !== ns) {
      return false;
    }

    const tagName = element.localName;
    const attrName = attr.name;

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
