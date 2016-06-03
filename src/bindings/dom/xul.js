import { Localization } from './base';
import { overlayElement } from './overlay';

const allowed = {
  elements: [],
  attributes: {
    global: ['title', 'aria-label', 'aria-valuetext', 'aria-moz-hint'],
    button: ['accesskey'],
    tab: ['label'],
    textbox: ['placeholder'],
  }
};

export class XULLocalization extends Localization {
  overlayElement(element, translation) {
    // XXX make it use allowed from above
    return overlayElement(element, translation);
  }
}
