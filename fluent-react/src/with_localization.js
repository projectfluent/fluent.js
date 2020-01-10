import { createElement, useContext } from "react";
import FluentContext from "./context";

export default function withLocalization(Inner) {
  function WithLocalization(props) {
    const { l10n } = useContext(FluentContext);
    return createElement(
      Inner,
      // getString needs to be re-bound on updates to trigger a re-render
      {
        getString: (id, args, fallback) => (
          l10n
            ? l10n.getString(id, args, fallback)
            : fallback || id
        ),
        ...props
      },
    );
  }

  WithLocalization.displayName = `WithLocalization(${displayName(Inner)})`;

  return WithLocalization;
}

function displayName(component) {
  return component.displayName || component.name || "Component";
}
