import 'fluent-intl-polyfill/compat';
import { FluentBundle } from 'fluent/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';

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

export function* generateBundles(userLocales) {
  // Choose locales that are best for the user.
  const currentLocales = negotiateLanguages(
    userLocales,
    ['en-US', 'pl'],
    { defaultLocale: 'en-US' }
  );

  for (const locale of currentLocales) {
    const bundle = new FluentBundle(locale);
    bundle.addMessages(MESSAGES_ALL[locale]);
    yield bundle;
  }
}
