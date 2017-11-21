import 'fluent-intl-polyfill';
import { MessageContext } from 'fluent';
import { negotiateLanguages } from 'fluent-langneg';

const MESSAGES_ALL = {
  'pl': `
hello = Witaj świecie!
button-show-alert = Kliknij mnie
  `,
  'en-US': `
hello = Hello, world!
button-show-alert = Click me
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
