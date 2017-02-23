import React, { cloneElement, Children, Component } from 'react';
import 'fluent-intl-polyfill';
import { LocalizationProvider as StaticProvider } from 'fluent-react';

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

export class LocalizationProvider extends Component {
  state = {
    locales: negotiateLanguages(navigator.language)
  }

  handleLocaleChange(locale) {
    this.setState({ locales: negotiateLanguages(locale) });
  }

  render() {
    const { locales } = this.state;
    const child = Children.only(this.props.children);
    const l10nProps = {
      locales,
      handleLocaleChange: locale => this.handleLocaleChange(locale)
    };
    return (
      <StaticProvider {...this.props} locales={locales}>
        { cloneElement(child, l10nProps) }
      </StaticProvider>
    );
  }
}
