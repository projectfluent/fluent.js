import { prioritizeLocales } from '../../intl/locale';
import { ResourceBundle } from './resourcebundle';

this.EXPORTED_SYMBOLS = ['L10nService'];

const resIndex = {
  'chrome://global/locale/aboutSupport.{locale}.ftl': ['pl', 'en-US'],
  'chrome://branding/locale/brand.{locale}.ftl': ['pl', 'en-US'],
  'chrome://global/locale/resetProfile.{locale}.ftl': ['pl', 'en-US'],
  'chrome://browser/locale/aboutDialog.ftl': ['pl', 'en-US']
};

function getLanguages(resIds) {
  let locales = new Set();

  for (let id of resIds) {
    if (resIndex[id]) {
      resIndex[id].forEach(resid => locales.add(resid));
    }
  }
  return locales;
}

this.L10nService = {
  getResources(requestedLangs, resIds) {
    const defaultLang = 'en-US';
    const availableLangs = getLanguages(resIds);
    const supportedLocales = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs);
    const resBundles = Array.from(supportedLocales).map(
      lang => new ResourceBundle(lang, resIds)
    );
    return {
      availableLangs,
      resBundles
    };
  },
  
  test() {
    return new ResourceBundle('en-US', []);
  }
};
