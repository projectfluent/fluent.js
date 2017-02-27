import React, { Component } from 'react';
import { connect } from 'react-redux';
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

class AppLocalizationProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: ''
    };
  }

  componentWillMount() {
    const { locales } = this.props;
    this.fetchMessages(locales);
  }

  componentWillReceiveProps(next) {
    const { locales } = next;

    // When the language changes Redux passes a new locale as a prop; start
    // fetching the translations.
    if (locales[0] !== this.props.locales[0]) {
      this.fetchMessages(locales);
    }
  }

  shouldComponentUpdate(_, nextState) {
    // Only re-render if the messages are different.
    return nextState.messages !== this.state.messages;
  }

  async fetchMessages(locales) {
    const messages = await fetchMessages(locales);
    this.setState({ messages });
  }

  render() {
    const { locales, children } = this.props;
    const { messages } = this.state;

    if (!messages) {
      // Show a loader.
      return <div>…</div>;
    }

    return (
      <LocalizationProvider locales={locales} messages={messages}>
        {children}
      </LocalizationProvider>
    );
  }
}

function mapStateToProps(state) {
  return {
    locales: state.locales,
  };
}

export default connect(mapStateToProps)(
  AppLocalizationProvider
);
