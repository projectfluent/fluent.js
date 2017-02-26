import React, { Component } from 'react';

import 'fluent-intl-polyfill';
import { LocalizationProvider } from 'fluent-react';

function delay(value) {
  return new Promise(
    resolve => setTimeout(() => resolve(value), 1000)
  );
}

async function fetchMessages(locales) {
  switch(locales[0]) {
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
