import { LocalizationObserver } from './base';

export class ChromeLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {
    // check data-l10n-bundle, check for BindingParent, getAnonymousNodes if 
    // needed
  }
}
