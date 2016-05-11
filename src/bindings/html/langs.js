import { prioritizeLocales } from '../../lib/intl';
import { pseudo } from '../../lib/pseudo';

export function negotiateLanguages(
  { appVersion, defaultLang, availableLangs }, prevLangs, requestedLangs
) {

  const allAvailableLangs = Object.keys(availableLangs)
    .concat(Object.keys(pseudo));
  const newLangs = prioritizeLocales(
    defaultLang, allAvailableLangs, requestedLangs
  );

  const langs = newLangs.map(code => ({
    code: code,
    src: getLangSource(appVersion, availableLangs, code),
    ver: appVersion,
  }));

  return { langs, haveChanged: !arrEqual(prevLangs, newLangs) };
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}

function getLangSource(appVersion, availableLangs, code) {
  if ((code in pseudo) && !(code in availableLangs)) {
    return 'pseudo';
  }

  return 'app';
}
