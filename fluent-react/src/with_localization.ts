import { createElement, useContext, ComponentType, ReactElement } from "react";
import { FluentContext } from "./context.js";
import { FluentVariable } from "@fluent/bundle";

export interface WithLocalizationProps {
  getString(
    id: string,
    vars?: Record<string, FluentVariable> | null,
    fallback?: string
  ): string;
  getFormattedMessage(
    id: string,
    vars?: Record<string, FluentVariable> | null
  ): {
    value: string | null;
    attributes?: Record<string, string>;
  };
}

export function withLocalization<P extends WithLocalizationProps>(
  Inner: ComponentType<P>
): ComponentType<
  Omit<P, keyof WithLocalizationProps> & Partial<WithLocalizationProps>
> {
  function WithLocalization(
    props: Omit<P, keyof WithLocalizationProps> & Partial<WithLocalizationProps>
  ): ReactElement {
    const l10n = useContext(FluentContext);
    if (!l10n) {
      throw new Error(
        "withLocalization was used without wrapping it in a " +
          "<LocalizationProvider />."
      );
    }
    // Re-bind getString to trigger a re-render of Inner.
    const getString = l10n.getString.bind(l10n);
    const getFormattedMessage = l10n.getFormattedMessage.bind(l10n);
    return createElement(Inner, {
      getString,
      getFormattedMessage,
      ...props,
    } as P);
  }

  WithLocalization.displayName = `WithLocalization(${displayName(Inner)})`;

  return WithLocalization;
}

function displayName<P>(component: ComponentType<P>): string {
  return component.displayName || component.name || "Component";
}
