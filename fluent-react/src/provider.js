import { Component, Children, PropTypes } from 'react';

import Localization from './localization';

export default class LocalizationProvider extends Component {
  constructor(props) {
    super(props);

    const { locales, messages } = props;
    this.l10n = new Localization(locales, messages);
  }

  getChildContext() {
    return {
      l10n: this.l10n
    };
  }

  componentWillReceiveProps(next) {
    const { locales, messages } = next;

    if (locales !== this.props.locales) {
      this.l10n.createContext(locales, messages);
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
