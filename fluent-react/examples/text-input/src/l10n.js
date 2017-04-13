import 'fluent-intl-polyfill';
import { MessageContext } from 'fluent/compat';
import negotiateLanguages from 'fluent-langneg/compat';

const MESSAGES_ALL = {
  'pl': `
hello = Cześć { $username }!
hello-no-name = Witaj nieznajomy!
type-name
    .placeholder = Twoje imię
  `,
  'en-US': `
hello = Hello, { $username }!
hello-no-name = Hello, stranger!
type-name
    .placeholder = Your name
  `,
};

export function* generateMessages(userLocales) {
  // Choose locales that are best for the user.
  const currentLocales = negotiateLanguages(
    userLocales,
    ['en-US', 'pl'],
    { defaultLocale: 'en-US' }
  );

  for (const locale of currentLocales) {
    const cx = new MessageContext(locale);
    cx.addMessages(MESSAGES_ALL[locale]);
    yield cx;
  }
}
