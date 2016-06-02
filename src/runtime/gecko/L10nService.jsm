import { prioritizeLocales } from '../../intl/locale';
import { ResourceBundle } from './resourcebundle';
import { resIndex } from './io';

this.EXPORTED_SYMBOLS = ['L10nService'];

function getLanguages(resIds) {
  const locales = new Set();

  for (let id of resIds) {
    if (resIndex[id]) {
      Object.keys(resIndex[id]).forEach(lang => {
        locales.add(lang);
      });
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
};
