import { MessageContext } from 'fluent/compat';
import negotiateLanguages from 'fluent-langneg/compat';

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

  const generateMessages = function* () {
    for (const locale of currentLocales) {
      const cx = new MessageContext(locale);
      cx.addMessages(MESSAGES_ALL[locale]);
      yield cx;
    }
  }

  return {
    type: 'CHANGE_LOCALES',
    userLocales,
    currentLocales,
    messages: generateMessages()
  };
}
