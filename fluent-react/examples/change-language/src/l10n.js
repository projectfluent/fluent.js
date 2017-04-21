import React, { cloneElement, Children, Component } from 'react';

import 'fluent-intl-polyfill/compat';
import { MessageContext } from 'fluent/compat';
import { LocalizationProvider } from 'fluent-react/compat';
import negotiateLanguages from 'fluent-langneg/compat';

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

function* generateMessages(currentLocales) {
  for (const locale of currentLocales) {
    const cx = new MessageContext(locale);
    cx.addMessages(MESSAGES_ALL[locale]);
    yield cx;
  }
}

export class AppLocalizationProvider extends Component {
  constructor(props) {
    super(props);

    const { userLocales } = props;

    const currentLocales = negotiateLanguages(
      userLocales,
      ['en-US', 'pl'],
      { defaultLocale: 'en-US' }
    );

    this.state = {
      currentLocales
    };
  }

  handleLocaleChange(locale) {
    this.setState({
      currentLocales: [locale]
    });
  }

  render() {
    const { currentLocales } = this.state;
    const child = Children.only(this.props.children);

    const l10nProps = {
      currentLocales,
      handleLocaleChange: locale => this.handleLocaleChange(locale)
    };

    return (
      <LocalizationProvider messages={generateMessages(currentLocales)}>
        { cloneElement(child, l10nProps) }
      </LocalizationProvider>
    );
  }
}
