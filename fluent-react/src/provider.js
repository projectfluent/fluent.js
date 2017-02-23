import { Component, Children, PropTypes } from 'react';

import Localization from './localization';

export default class LocalizationProvider extends Component {
  constructor(props) {
    super(props);

    const { locales, requestMessages } = props;
    this.l10n = new Localization(locales, requestMessages);
  }

  getChildContext() {
    return {
      l10n: this.l10n
    };
  }

  componentWillReceiveProps(next) {
    const { locales } = next;

    if (locales !== this.props.locales) {
      this.l10n.setLocales(locales);
    }
  }

  render() {
    return Children.only(this.props.children);
  }
}

LocalizationProvider.childContextTypes = {
  l10n: PropTypes.object
};

LocalizationProvider.propTypes = {
  children: PropTypes.element.isRequired
};
