import { connect } from 'react-redux';
import 'fluent-intl-polyfill';
import { LocalizationProvider } from 'fluent-react';
import negotiateLanguages from 'fluent-langneg';

export function negotiateAvailable(requested) {
  return negotiateLanguages(
    requested, ['en-US', 'pl'], { defaultLocale: 'en-US' }
  )
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

export default connect(mapStateToProps)(
  LocalizationProvider
);
