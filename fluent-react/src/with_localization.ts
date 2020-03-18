import { createElement, useContext, ComponentType, ReactElement } from "react";
import { FluentContext } from "./context";
import { FluentArgument } from "@fluent/bundle";

export interface WithLocalizationProps {
  getString(
    id: string,
    args?: Record<string, FluentArgument> | null,
    fallback?: string): string;
}

type WithoutLocalizationProps<P> = Omit<P, keyof WithLocalizationProps>
  & Partial<WithLocalizationProps>;

export function withLocalization<P extends WithLocalizationProps>(
  Inner: ComponentType<P>
): ComponentType<WithoutLocalizationProps<P>> {
  function WithLocalization(props: WithoutLocalizationProps<P>): ReactElement {
    const l10n = useContext(FluentContext);
    // Re-bind getString to trigger a re-render of Inner.
    const getString = l10n.getString.bind(l10n);
    return createElement(Inner, { getString, ...props } as P);
  }

  WithLocalization.displayName = `WithLocalization(${displayName(Inner)})`;

  return WithLocalization;
}

function displayName<P>(component: ComponentType<P>): string {
  return component.displayName || component.name || "Component";
}
