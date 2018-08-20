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
    const { bundles, children } = this.props;

    if (!bundles) {
      // Show a loader
      return <div>…</div>;
    }

    return (
      <LocalizationProvider bundles={bundles}>
        {children}
      </LocalizationProvider>
    );
  }
}

const mapStateToProps = state => ({ bundles: state.bundles });
const mapDispatchToProps = { changeLocales };

export default connect(mapStateToProps, mapDispatchToProps)(
  AppLocalizationProvider
);
