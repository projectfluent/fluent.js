import 'fluent-intl-polyfill';
export { LocalizationProvider } from 'fluent-react';

export function requestMessages(locale) {
  switch(locale) {
    case 'pl':
      return `
hello = Cześć { $username }!
hello-no-name = Witaj nieznajomy!
type-name
    .placeholder = Twoje imię
      `;

    default:
      return `
hello = Hello, { $username }!
hello-no-name = Hello, stranger!
type-name
    .placeholder = Your name
      `;
  }
}

// Don't do this at home.
export function negotiateLanguages(locale) {
  const [langtag] = locale.split('-');
  switch(langtag) {
    case 'pl':
      return ['pl', 'en-US'];
    default:
      return ['en-US'];
  }
}
