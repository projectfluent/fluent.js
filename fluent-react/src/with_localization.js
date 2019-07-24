import { createElement, Component } from "react";

export default function withLocalization(Inner) {
  class WithLocalization extends Component {
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

  return WithLocalization;
}

function displayName(component) {
  return component.displayName || component.name || "Component";
}
