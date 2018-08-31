import { FluentBundle } from 'fluent/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';

const MESSAGES_ALL = {
  'pl': `
title = Witaj świecie!
current = Bieżący język: { $locale }
change = Zmień na { $locale }
  `,
  'en-US': `
title = Hello, world!
current = Current locale: { $locale }
change = Change to { $locale }
  `,
};

export function changeLocales(userLocales) {
  const currentLocales = negotiateLanguages(
    userLocales,
    ['en-US', 'pl'],
    { defaultLocale: 'en-US' }
  );

  const generateBundles = function* () {
    for (const locale of currentLocales) {
      const bundle = new FluentBundle(locale);
      bundle.addMessages(MESSAGES_ALL[locale]);
      yield bundle;
    }
  }

  return {
    type: 'CHANGE_LOCALES',
    userLocales,
    currentLocales,
    bundles: generateBundles()
  };
}
