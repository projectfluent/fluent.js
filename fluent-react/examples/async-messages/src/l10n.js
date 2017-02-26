import React, { Component } from 'react';
import delay from 'delay';

import 'fluent-intl-polyfill';
import { LocalizationProvider } from 'fluent-react';

async function fetchMessages(locales) {
  const { PUBLIC_URL } = process.env;
  // For the sake of the example take only the first locale.
  const locale = locales[0];
  const response = await fetch(`${PUBLIC_URL}/${locale}.ftl`);
  const messages = await response.text();

  await delay(1000);
  return messages;
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

export class AppLocalizationProvider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      locales: negotiateLanguages(props.requested),
      messages: ''
    };
  }

  componentWillMount() {
    fetchMessages(this.state.locales).then(
      messages => this.setState({ messages })
    );
  }

  render() {
    const { children } = this.props;
    const { locales, messages } = this.state;

    if (!messages) {
      // Show a loader?
      return <div>…</div>;
    }

    return (
      <LocalizationProvider locales={locales} messages={messages}>
        {children}
      </LocalizationProvider>
    );
  }
}
