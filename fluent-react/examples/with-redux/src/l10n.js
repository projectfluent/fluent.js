import { connect } from 'react-redux';
import 'fluent-intl-polyfill';
import { LocalizationProvider as StaticProvider } from 'fluent-react';


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

export function requestMessages(locale) {
  switch(locale) {
    case 'pl':
      return `
title = Witaj świecie!
current = Bieżący język: { $locale }
change = Zmień na { $locale }
      `;

    default:
      return `
title = Hello, world!
current = Current locale: { $locale }
change = Change to { $locale }
      `;
  }
}

function mapStateToProps(state) {
  return {
    locales: state.locales
  };
}

export const LocalizationProvider = connect(mapStateToProps)(StaticProvider);
