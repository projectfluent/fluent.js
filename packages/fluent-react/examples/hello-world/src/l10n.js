import { FluentBundle } from 'fluent/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';

const MESSAGES_ALL = {
  'pl': `
title = Witaj świecie!
today-is = Dziś jest { DATETIME($date, month: "long", day: "numeric") }.
  `,
  'en-US': `
title = Hello, world!
today-is = Today is { DATETIME($date, month: "long", day: "numeric") }.
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
