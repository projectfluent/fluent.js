import { FluentBundle } from 'fluent/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';
import delay from 'delay';

// Hand off handling FTL assets to Parcel.
import ftl from "../public/*.ftl";

async function fetchMessages(locale) {
  const response = await fetch(ftl[locale]);
  const messages = await response.text();

  await delay(1000);
  return { [locale]: messages };
}

export function changeLocales(userLocales) {
  return async function(dispatch) {
    dispatch({ type: 'CHANGE_LOCALES_REQUEST' });

    const currentLocales = negotiateLanguages(
      userLocales,
      ['en-US', 'pl'],
      { defaultLocale: 'en-US' }
    );

    const fetched = await Promise.all(
      currentLocales.map(fetchMessages)
    );

    const messages = fetched.reduce(
      (obj, cur) => Object.assign(obj, cur)
    );

    const generateBundles = function* () {
      for (const locale of currentLocales) {
        const bundle = new FluentBundle(locale);
        bundle.addMessages(messages[locale]);
        yield bundle;
      }
    }

    dispatch({
      type: 'CHANGE_LOCALES_RESPONSE',
      userLocales,
      currentLocales,
      bundles: generateBundles()
    });
  };
}
