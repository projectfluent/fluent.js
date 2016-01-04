import { prioritizeLocales } from '../../lib/intl';
import { pseudo } from '../../lib/pseudo';

export function negotiateLanguages(
  { appVersion, defaultLang, availableLangs }, additionalLangs, prevLangs,
  requestedLangs) {

  const allAvailableLangs = Object.keys(availableLangs)
    .concat(Object.keys(additionalLangs))
    .concat(Object.keys(pseudo));
  const newLangs = prioritizeLocales(
    defaultLang, allAvailableLangs, requestedLangs);

  const langs = newLangs.map(code => ({
    code: code,
    src: getLangSource(appVersion, availableLangs, additionalLangs, code),
    ver: appVersion,
  }));

  return { langs, haveChanged: !arrEqual(prevLangs, newLangs) };
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}

function getMatchingLangpack(appVersion, langpacks) {
  for (let i = 0, langpack; (langpack = langpacks[i]); i++) {
    if (langpack.target === appVersion) {
      return langpack;
    }
  }
  return null;
}

function getLangSource(appVersion, availableLangs, additionalLangs, code) {
  if (additionalLangs && additionalLangs[code]) {
    const lp = getMatchingLangpack(appVersion, additionalLangs[code]);
    if (lp &&
        (!(code in availableLangs) ||
         parseInt(lp.revision) > availableLangs[code])) {
      return 'extra';
    }
  }

  if ((code in pseudo) && !(code in availableLangs)) {
    return 'pseudo';
  }

  return 'app';
}
