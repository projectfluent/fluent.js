import 'fluent-intl-polyfill/compat';
import { FluentBundle } from 'fluent/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';

const MESSAGES_ALL = {
  'pl': `
sign-in-or-cancel = <signin>Zaloguj</signin> albo <cancel>anuluj</cancel>.
clicked-sign-in = Brawo!
clicked-cancel = OK, nieważne.

agree-prompt = Nazywam się <input/> i <button>zgadzam się</button>.
agree-alert = Fajnie, zgadzamy się.
  `,
  'en-US': `
sign-in-or-cancel = <signin>Sign in</signin> or <cancel>cancel</cancel>.
clicked-sign-in = You are now signed in.
clicked-cancel = OK, nevermind.

agree-prompt = My name is <input/> and <button>I agree</button>.
agree-alert = Cool, agreed.
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
    const bundle = new FluentBundle(locale);
    bundle.addMessages(MESSAGES_ALL[locale]);
    yield bundle;
  }
}
