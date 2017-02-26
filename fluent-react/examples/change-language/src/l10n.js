import React, { cloneElement, Children, Component } from 'react';

import 'fluent-intl-polyfill';
import { LocalizationProvider } from 'fluent-react';

const MESSAGES_ALL = {
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

// Don't do this at home.
function negotiateLanguages(locale) {
  const [langtag] = locale.split('-');
  switch(langtag) {
    case 'pl':
      return ['pl', 'en-US'];
    default:
      return ['en-US'];
  }
}

export class AppLocalizationProvider extends Component {
  constructor(props) {
    super(props);

    const locales = negotiateLanguages(props.requested);
    this.state = {
      locales,
      messages: MESSAGES_ALL[locales[0]]
    };
  }

  handleLocaleChange(locale) {
    const locales = negotiateLanguages(locale);
    this.setState({
      locales,
      messages: MESSAGES_ALL[locales[0]]
    });
  }

  render() {
    const { locales, messages } = this.state;
    const child = Children.only(this.props.children);

    const l10nProps = {
      locales,
      handleLocaleChange: locale => this.handleLocaleChange(locale)
    };

    return (
      <LocalizationProvider locales={locales} messages={messages}>
        { cloneElement(child, l10nProps) }
      </LocalizationProvider>
    );
  }
}
