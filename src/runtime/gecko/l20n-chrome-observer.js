import { ChromeLocalizationObserver } from '../../bindings/observer/chrome';

document.l10n = new ChromeLocalizationObserver();
window.addEventListener('languagechange', document.l10n);
