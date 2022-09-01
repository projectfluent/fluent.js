import {
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

  return l10n.getElement(children, id, { attrs, vars, elems });
}

export default Localized;
