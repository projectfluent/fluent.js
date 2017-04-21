import React, { Component } from 'react';
import delay from 'delay';

import 'fluent-intl-polyfill/compat';
import { MessageContext } from 'fluent/compat';
import { LocalizationProvider } from 'fluent-react/compat';
import negotiateLanguages from 'fluent-langneg/compat';

async function fetchMessages(locale) {
  const { PUBLIC_URL } = process.env;
  const response = await fetch(`${PUBLIC_URL}/${locale}.ftl`);
  const messages = await response.text();

  await delay(1000);
  return { [locale]: messages };
}

async function createMessagesGenerator(currentLocales) {
  const fetched = await Promise.all(
    currentLocales.map(fetchMessages)
  );
  const bundle = fetched.reduce(
    (obj, cur) => Object.assign(obj, cur)
  );

  return function* generateMessages() {
    for (const locale of currentLocales) {
      const cx = new MessageContext(locale);
      cx.addMessages(bundle[locale]);
      yield cx;
    }
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
      currentLocales,
    };
  }

  async componentWillMount() {
    const { currentLocales } = this.state;
    const generateMessages  = await createMessagesGenerator(currentLocales);
    this.setState({ messages: generateMessages() });
  }

  render() {
    const { children } = this.props;
    const { messages } = this.state;

    if (!messages) {
      // Show a loader.
      return <div>…</div>;
    }

    return (
      <LocalizationProvider messages={messages}>
        {children}
      </LocalizationProvider>
    );
  }
}
