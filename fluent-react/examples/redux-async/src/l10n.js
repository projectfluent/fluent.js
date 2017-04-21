import React, { Component } from 'react';
import { connect } from 'react-redux';

import 'fluent-intl-polyfill/compat';
import { LocalizationProvider } from 'fluent-react/compat';

import { changeLocales } from './actions';


class AppLocalizationProvider extends Component {
  componentWillMount() {
    this.props.changeLocales(navigator.languages);
  }

  render() {
    const { messages, children } = this.props;

    if (!messages) {
      // Show a loader
      return <div>…</div>;
    }

    return (
      <LocalizationProvider messages={messages}>
        {children}
      </LocalizationProvider>
    );
  }
}

const mapStateToProps = state => ({ messages: state.messages });
const mapDispatchToProps = { changeLocales };

export default connect(mapStateToProps, mapDispatchToProps)(
  AppLocalizationProvider
);
