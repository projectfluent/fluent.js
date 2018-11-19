import React, { Component } from 'react';
import delay from 'delay';

import { FluentBundle } from 'fluent/compat';
import { LocalizationProvider } from 'fluent-react/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';

// Hand off handling FTL assets to Parcel.
import ftl from '../public/*.ftl';

async function fetchMessages(locale) {
  const response = await fetch(ftl[locale]);
  const messages = await response.text();

  await delay(1000);
  return { [locale]: messages };
}

async function createMessagesGenerator(currentLocales) {
  const fetched = await Promise.all(
    currentLocales.map(fetchMessages)
  );
  const messages = fetched.reduce(
    (obj, cur) => Object.assign(obj, cur)
  );

  return function* generateBundles() {
    for (const locale of currentLocales) {
      const bundle = new FluentBundle(locale);
      bundle.addMessages(messages[locale]);
      yield bundle;
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
    const generateBundles  = await createMessagesGenerator(currentLocales);
    this.setState({ bundles: generateBundles() });
  }

  render() {
    const { children } = this.props;
    const { bundles } = this.state;

    if (!bundles) {
      // Show a loader.
      return <div>…</div>;
    }

    return (
      <LocalizationProvider bundles={bundles}>
        {children}
      </LocalizationProvider>
    );
  }
}
