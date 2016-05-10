import { prioritizeLocales } from '../../lib/shims';

export function negotiateLanguages(
  { defaultLang, availableLangs }, prevLangs, requestedLangs
) {

  const newLangs = prioritizeLocales(
    defaultLang, Object.keys(availableLangs), requestedLangs
  );

  const langs = newLangs.map(code => ({
    code: code,
    src: 'app',
  }));

  return { langs, haveChanged: !arrEqual(prevLangs, newLangs) };
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}
