import 'fluent-intl-polyfill';
export { LocalizationProvider } from 'fluent-react';
import negotiateLanguages from 'fluent-langneg';

export function negotiateAvailable(requested) {
  return negotiateLanguages(
    requested, ['en-US', 'pl'], { defaultLocale: 'en-US' }
  )
}

export const MESSAGES_ALL = {
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
