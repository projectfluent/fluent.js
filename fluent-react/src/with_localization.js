import { createElement, Component } from "react";

import { isReactLocalization } from "./localization";

import hoistNonReactStatics from "hoist-non-react-statics";

export default function withLocalization(Inner) {
  class WithLocalization extends Component {
    componentDidMount() {
      const { l10n } = this.context;

      if (l10n) {
        l10n.subscribe(this);
      }
    }

    componentWillUnmount() {
      const { l10n } = this.context;

      if (l10n) {
        l10n.unsubscribe(this);
      }
    }

    /*
     * Rerender this component in a new language.
     */
    relocalize() {
      // When the `ReactLocalization`'s fallback chain changes, update the
      // component.
      this.forceUpdate();
    }

    /*
     * Find a translation by `id` and format it to a string using `args`.
     */
    getString(id, args, fallback) {
      const { l10n } = this.context;

      if (!l10n) {
        return fallback || id;
      }

      return l10n.getString(id, args, fallback);
    }

    render() {
      return createElement(
        Inner,
        Object.assign(
          // getString needs to be re-bound on updates to trigger a re-render
          { getString: (...args) => this.getString(...args) },
          this.props
        )
      );
    }
  }

  WithLocalization.displayName = `WithLocalization(${displayName(Inner)})`;

  WithLocalization.contextTypes = {
    l10n: isReactLocalization
  };

  return hoistNonReactStatics(WithLocalization, Inner);
}

function displayName(component) {
  return component.displayName || component.name || "Component";
}
