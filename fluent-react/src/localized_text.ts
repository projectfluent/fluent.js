import {
  Fragment,
  ReactElement,
  ReactNode,
  createElement,
  useContext
} from "react";
import PropTypes from "prop-types";
import { FluentContext } from "./context";
import { FluentVariable } from "@fluent/bundle";

export interface LocalizedTextProps {
  id: string;
  children?: ReactNode;
  vars?: Record<string, FluentVariable>;
}
/*
 * The `LocalizedText` component renders a translation as a string.
 *
 *     <LocalizedText id="hello-world">
 *         Hello, world!
 *     </LocalizedText>
 *
 * The string passed as the child will be used as the fallback if the
 * translation is missing. It's also possible to pass no fallback:
 *
 *     <LocalizedText id="hello-world" />
 *
 * Arguments to the translation can be passed as an object in the `vars` prop.
 *
 *     <LocalizedText id="hello-world" vars={{userName: name}}>
 *         {'Hello, {$userName}!'}
 *     </LocalizedText>
 */
export function LocalizedText(props: LocalizedTextProps): ReactElement {
  const { id, vars, children: child = null } = props;

  const l10n = useContext(FluentContext);
  if (!l10n) {
    // Use the child as fallback.
    return createElement(Fragment, null, child);
  }

  const bundle = l10n.getBundle(id);
  if (bundle === null) {
    // Use the child as fallback.
    return createElement(Fragment, null, child);
  }

  // l10n.getBundle makes the bundle.hasMessage check which ensures that
  // bundle.getMessage returns an existing message.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const msg = bundle.getMessage(id)!;

  if (msg.value === null) {
    // Use the child as fallback.
    return createElement(Fragment, null, child);
  }

  let errors: Array<Error> = [];
  let value = bundle.formatPattern(msg.value, vars, errors);
  for (let error of errors) {
    l10n.reportError(error);
  }

  // Replace the fallback string with the message value;
  return createElement(Fragment, null, value);

}

LocalizedText.propTypes = {
  children: PropTypes.string
};
