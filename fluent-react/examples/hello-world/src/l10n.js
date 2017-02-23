import 'fluent-intl-polyfill';
export { LocalizationProvider } from 'fluent-react';

export function requestMessages(locale) {
  switch(locale) {
    case 'pl':
      return `
title = Witaj świecie!
      `;

    default:
      return `
title = Hello, world!
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
