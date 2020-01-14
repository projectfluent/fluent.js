import { createElement, useContext } from "react";
import FluentContext from "./context";

export default function withLocalization(Inner) {
  function WithLocalization(props) {
    const l10n = useContext(FluentContext);
    return createElement(
      Inner,
      {
        // getString needs to be re-bound to trigger a re-render of Inner
        getString: (id, args, fallback) => l10n.getString(id, args, fallback),
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
