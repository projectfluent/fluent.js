import { createElement, Component } from 'react';

import { isLocalization } from './localization';

export default function withLocalization(Inner) {
  class WithLocalization extends Component {
    constructor(props, context) {
      super(props, context);
      this.formatString = this.formatString.bind(this);
    }

    formatString(id, args) {
      const { l10n } = this.context;

      if (!l10n) {
        throw new Error(
          `${this.displayName} must be a descendant of a LocalizationProvider.`
        );
      }

      const mcx = l10n.getMessageContext(id);

      if (mcx === null) {
        return id;
      }

      const msg = mcx.getMessage(id);
      return mcx.format(msg, args);
    }

    render() {
      return createElement(
        Inner,
        Object.assign({ formatString: this.formatString }, this.props)
      );
    }
  }

  WithLocalization.displayName = `WithLocalization(${displayName(Inner)})`;

  WithLocalization.contextTypes = {
    l10n: isLocalization
  };

  return WithLocalization;
}

function displayName(component) {
  return component.displayName || component.name || 'Component';
}
