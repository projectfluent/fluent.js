import 'fluent-intl-polyfill';

export const MESSAGES_ALL = {
  'pl': `
title = Witaj świecie!
  `,
  'en-US': `
title = Hello, world!
  `,
};

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
