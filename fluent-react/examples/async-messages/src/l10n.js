import 'fluent-intl-polyfill';
export { LocalizationProvider } from 'fluent-react';

function delay(value) {
  return new Promise(
    resolve => setTimeout(() => resolve(value), 1000)
  );
}

export async function requestMessages(locale) {
  switch(locale) {
    case 'pl':
      return delay(`
title = Witaj świecie!
      `);

    default:
      return delay(`
title = Hello, world!
      `);
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
