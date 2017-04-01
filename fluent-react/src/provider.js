import { Component, Children, PropTypes } from 'react';

import Messages from './messages';

export default class MessagesProvider extends Component {
  constructor(props) {
    super(props);

    const { locales, messages } = props;
    this.l10n = new Messages(locales, messages);
  }

  getChildContext() {
    return {
      l10n: this.l10n
    };
  }

  componentWillReceiveProps(next) {
    const { locales, messages } = next;

    if (messages !== this.props.messages) {
      this.l10n.createContext(locales, messages);
    }
  }

  render() {
    return Children.only(this.props.children);
  }
}

MessagesProvider.childContextTypes = {
  l10n: PropTypes.object
};

MessagesProvider.propTypes = {
  children: PropTypes.element.isRequired
};
