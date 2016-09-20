import { LocalizationObserver } from './base';

/**
 * The `ContentLocalizationObserver` is an extension of a `LocalizationObserver`
 * class which is used for all Web content.
 *
 * This class is used for all HTML content translations.
 */
export class ContentLocalizationObserver extends LocalizationObserver {
  translateRootContent(root) {
    return this.translateFragment(root);
  }
}
