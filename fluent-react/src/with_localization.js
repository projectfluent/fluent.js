import { createElement, Component } from 'react';

import { isReactLocalization } from './localization';

export default function withLocalization(Inner) {
  class WithLocalization extends Component {
    constructor(props, context) {
      super(props, context);
      this.getString = this.getString.bind(this);
    }

    /*
     * Find a translation by `id` and format it to a string using `args`.
     */
    getString(id, args) {
      const { l10n } = this.context;

      if (!l10n) {
        throw new Error(
          `${this.displayName} must be a descendant of a LocalizationProvider.`
        );
      }

      return l10n.getString(id, args);
    }

    render() {
      return createElement(
        Inner,
        Object.assign({ getString: this.getString }, this.props)
      );
    }
  }

  WithLocalization.displayName = `WithLocalization(${displayName(Inner)})`;

  WithLocalization.contextTypes = {
    l10n: isReactLocalization
  };

  return WithLocalization;
}

function displayName(component) {
  return component.displayName || component.name || 'Component';
}
