import { ReactElement, ReactNode, createElement, isValidElement } from "react";
import PropTypes from "prop-types";
import { FluentVariable } from "@fluent/bundle";
import { LocalizedElement } from "./localized_element";
import { LocalizedText } from "./localized_text";

export interface LocalizedProps {
  id: string;
  attrs?: Record<string, boolean>;
  children?: ReactNode;
  vars?: Record<string, FluentVariable>;
  elems?: Record<string, ReactElement>;
}
/*
 * The `Localized` component redirects to `LocalizedElement` or
 * `LocalizedText`, depending on props.children.
 */
export function Localized(props: LocalizedProps): ReactElement {
  if (!props.children || typeof props.children === "string") {
    // Redirect to LocalizedText for string children: <Localized>Fallback
    // copy</Localized>, and empty calls: <Localized />.
    return createElement(LocalizedText, props);
  }

  if (isValidElement(props.children)) {
    // Redirect to LocalizedElement for element children. Only a single element
    // child is supported; LocalizedElement enforces this requirement.
    return createElement(LocalizedElement, props);
  }

  throw new Error(
    "<Localized> can be used either similar to <LocalizedElement>, " +
    "in which case it expects a single React element child, or similar to " +
    "<LocalizedText>, in which case it expects a single string-typed child " +
    "or no children at all."
  );
}

Localized.propTypes = {
  children: PropTypes.node
};
