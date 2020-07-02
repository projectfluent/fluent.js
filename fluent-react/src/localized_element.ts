import {
  Fragment,
  ReactElement,
  ReactNode,
  cloneElement,
  createElement,
  isValidElement,
  useContext
} from "react";
import PropTypes from "prop-types";
import voidElementTags from "../vendor/voidElementTags";
import { FluentContext } from "./context";
import { FluentVariable } from "@fluent/bundle";

// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reMarkup = /<|&#?\w+;/;

export interface LocalizedElementProps {
  id: string;
  attrs?: Record<string, boolean>;
  children?: ReactNode;
  vars?: Record<string, FluentVariable>;
  elems?: Record<string, ReactElement>;
}
/*
 * The `LocalizedElement` component renders its child with translated contents
 * and props.
 *
 *     <Localized id="hello-world">
 *         <p>Hello, world!</p>
 *     </Localized>
 *
 * Arguments to the translation can be passed as an object in the `vars` prop.
 *
 *     <LocalizedElement id="hello-world" vars={{userName: name}}>
 *         <p>{'Hello, {$userName}!'}</p>
 *     </LocalizedElement>
 *
 * The props of the wrapped child can be localized using Fluent attributes
 * found on the requested message, provided they are explicitly allowed by the
 * `attrs` prop.
 *
 *     <LocalizedElement id="hello-world" attrs={{title: true}}>
 *         <p>Hello, world!</p>
 *     </LocalizedElement>
 */
export function LocalizedElement(props: LocalizedElementProps): ReactElement {
  const { id, attrs, vars, elems, children: child = null } = props;

  // Check if the child inside <LocalizedElement> is a valid element.
  if (!isValidElement(child)) {
    throw new Error("<LocalizedElement/> expected to receive a single " +
      "React element child");
  }

  const l10n = useContext(FluentContext);
  if (!l10n) {
    // Use the wrapped component as fallback.
    return createElement(Fragment, null, child);
  }

  const bundle = l10n.getBundle(id);
  if (bundle === null) {
    // Use the wrapped component as fallback.
    return createElement(Fragment, null, child);
  }

  let errors: Array<Error> = [];

  // l10n.getBundle makes the bundle.hasMessage check which ensures that
  // bundle.getMessage returns an existing message.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const msg = bundle.getMessage(id)!;

  let localizedProps: Record<string, string> | undefined;

  // The default is to forbid all message attributes. If the attrs prop exists
  // on the Localized instance, only set message attributes which have been
  // explicitly allowed by the developer.
  if (attrs && msg.attributes) {
    localizedProps = {};
    errors = [];
    for (const [name, allowed] of Object.entries(attrs)) {
      if (allowed && name in msg.attributes) {
        localizedProps[name] = bundle.formatPattern(
          msg.attributes[name], vars, errors);
      }
    }
    for (let error of errors) {
      l10n.reportError(error);
    }
  }

  // If the wrapped component is a known void element, explicitly dismiss the
  // message value and do not pass it to cloneElement in order to avoid the
  // "void element tags must neither have `children` nor use
  // `dangerouslySetInnerHTML`" error.
  if (child.type in voidElementTags) {
    return cloneElement(child, localizedProps);
  }

  // If the message has a null value, we're only interested in its attributes.
  // Do not pass the null value to cloneElement as it would nuke all children
  // of the wrapped component.
  if (msg.value === null) {
    return cloneElement(child, localizedProps);
  }

  errors = [];
  const messageValue = bundle.formatPattern(msg.value, vars, errors);
  for (let error of errors) {
    l10n.reportError(error);
  }

  // If the message value doesn't contain any markup nor any HTML entities,
  // insert it as the only child of the wrapped component.
  if (!reMarkup.test(messageValue) || l10n.parseMarkup === null) {
    return cloneElement(child, localizedProps, messageValue);
  }

  let elemsLower: Record<string, ReactElement>;
  if (elems) {
    elemsLower = {};
    for (let [name, elem] of Object.entries(elems)) {
      elemsLower[name.toLowerCase()] = elem;
    }
  }


  // If the message contains markup, parse it and try to match the children
  // found in the translation with the props passed to this Localized.
  const translationNodes = l10n.parseMarkup(messageValue);
  const translatedChildren = translationNodes.map(childNode => {
    if (childNode.nodeName === "#text") {
      return childNode.textContent;
    }

    const childName = childNode.nodeName.toLowerCase();

    // If the child is not expected just take its textContent.
    if (
      !elemsLower ||
      !Object.prototype.hasOwnProperty.call(elemsLower, childName)
    ) {
      return childNode.textContent;
    }

    const sourceChild = elemsLower[childName];

    // Ignore elems which are not valid React elements.
    if (!isValidElement(sourceChild)) {
      return childNode.textContent;
    }

    // If the element passed in the elems prop is a known void element,
    // explicitly dismiss any textContent which might have accidentally been
    // defined in the translation to prevent the "void element tags must not
    // have children" error.
    if (sourceChild.type in voidElementTags) {
      return sourceChild;
    }

    // TODO Protect contents of elements wrapped in <Localized>
    // https://github.com/projectfluent/fluent.js/issues/184
    // TODO  Control localizable attributes on elements passed as props
    // https://github.com/projectfluent/fluent.js/issues/185
    return cloneElement(sourceChild, undefined, childNode.textContent);
  });

  return cloneElement(child, localizedProps, ...translatedChildren);
}

LocalizedElement.propTypes = {
  children: PropTypes.element
};
