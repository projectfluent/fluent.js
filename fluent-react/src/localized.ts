import React, {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  useContext,
} from "react";
import { FluentContext } from "./context.js";
import { FluentVariable } from "@fluent/bundle";

export interface LocalizedProps {
  id: string;
  attrs?: Record<string, boolean>;
  children?: ReactNode | Array<ReactNode>;
  vars?: Record<string, FluentVariable>;
  elems?: Record<string, ReactElement>;
}
/*
 * The `Localized` class renders its child with translated props and children.
 *
 *     <Localized id="hello-world">
 *         <p>{'Hello, world!'}</p>
 *     </Localized>
 *
 * The `id` prop should be the unique identifier of the translation.  Any
 * attributes found in the translation will be applied to the wrapped element.
 *
 * Arguments to the translation can be passed as `$`-prefixed props on
 * `Localized`.
 *
 *     <Localized id="hello-world" $username={name}>
 *         <p>{'Hello, { $username }!'}</p>
 *     </Localized>
 *
 *  It's recommended that the contents of the wrapped component be a string
 *  expression.  The string will be used as the ultimate fallback if no
 *  translation is available.  It also makes it easy to grep for strings in the
 *  source code.
 */
export function Localized(props: LocalizedProps): ReactElement {
  const { id, attrs, vars, elems, children } = props;
  const l10n = useContext(FluentContext);

  if (!l10n) {
    throw new Error(
      "The <Localized /> component was not properly wrapped in a <LocalizationProvider />."
    );
  }

  let componentToRender: ReactNode | null;

  if (typeof children === "string") {
    componentToRender = children;
  } else if (!children) {
    componentToRender = null;
  } else if (Array.isArray(children) && children.length === 1) {
    componentToRender = children[0];
  } else {
    componentToRender = Children.only(children);
  }

  // Check if the component to render is a valid element -- if not, then
  // it's either null or a simple fallback string. No need to localize the
  // attributes or replace.
  if (!isValidElement(componentToRender)) {
    return React.createElement(
      React.Fragment,
      null,
      l10n.getString(
        id,
        vars,
        typeof componentToRender === "string" ? componentToRender : undefined
      )
    );
  }

  return l10n.getElement(componentToRender, id, { attrs, vars, elems });
}

export default Localized;
