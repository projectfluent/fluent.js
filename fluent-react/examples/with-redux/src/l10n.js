import { connect } from 'react-redux';
import 'fluent-intl-polyfill';
import { LocalizationProvider } from 'fluent-react';


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

export const MESSAGES_ALL = {
  'pl': `
title = Witaj świecie!
current = Bieżący język: { $locale }
change = Zmień na { $locale }
  `,
  'en-US': `
title = Hello, world!
current = Current locale: { $locale }
change = Change to { $locale }
  `,
};

function mapStateToProps(state) {
  return {
    locales: state.locales,
    messages: state.messages
  };
}

export const AppLocalizationProvider = connect(mapStateToProps)(
  LocalizationProvider
);
