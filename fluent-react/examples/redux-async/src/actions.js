import { MessageContext } from 'fluent/compat';
import negotiateLanguages from 'fluent-langneg/compat';
import delay from 'delay';

async function fetchMessages(locale) {
  const { PUBLIC_URL } = process.env;
  const response = await fetch(`${PUBLIC_URL}/${locale}.ftl`);
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

    const bundle = fetched.reduce(
      (obj, cur) => Object.assign(obj, cur)
    );

    const generateMessages = function* () {
      for (const locale of currentLocales) {
        const cx = new MessageContext(locale);
        cx.addMessages(bundle[locale]);
        yield cx;
      }
    }

    dispatch({
      type: 'CHANGE_LOCALES_RESPONSE',
      userLocales,
      currentLocales,
      messages: generateMessages()
    });
  };
}
