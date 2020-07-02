import { ReactElement, ReactNode, createElement } from "react";
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

  // Redirect to LocalizedElement for element children. Only a single element
  // child is supported; LocalizedElement enforces this requirement.
  return createElement(LocalizedElement, props);
}

Localized.propTypes = {
  children: PropTypes.node
};
