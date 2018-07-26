import { isValidElement, cloneElement, Component } from "react";
import PropTypes from "prop-types";

import { isReactLocalization } from "./localization";
import { parseMarkup } from "./markup";
import VOID_ELEMENTS from "../vendor/voidElementTags";

// Match the opening angle bracket (<) in HTML tags, and HTML entities like
// &amp;, &#0038;, &#x0026;.
const reMarkup = /<|&#?\w+;/;

/*
 * Prepare props passed to `Localized` for formatting.
 */
function toArguments(props) {
  const args = {};
  const elems = {};

  for (const [propname, propval] of Object.entries(props)) {
    if (propname.startsWith("$")) {
      const name = propname.substr(1);
      args[name] = propval;
    } else if (isValidElement(propval)) {
      // We'll try to match localNames of elements found in the translation with
      // names of elements passed as props. localNames are always lowercase.
      const name = propname.toLowerCase();
      elems[name] = propval;
    }
  }

  return [args, elems];
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
export default class Localized extends Component {
  componentDidMount() {
    const { l10n } = this.context;

    if (l10n) {
      l10n.subscribe(this);
    }
  }

  componentWillUnmount() {
    const { l10n } = this.context;

    if (l10n) {
      l10n.unsubscribe(this);
    }
  }

  /*
   * Rerender this component in a new language.
   */
  relocalize() {
    // When the `ReactLocalization`'s fallback chain changes, update the
    // component.
    this.forceUpdate();
  }

  render() {
    const { l10n } = this.context;
    const { id, attrs, children } = this.props;

    // Validate that children isn't an array
    if (Array.isArray(children)) {
      throw new Error("<Localized/> expected to receive a single " +
        "React node child");
    }

    if (!l10n) {
      // Use the wrapped component as fallback.
      return children;
    }

    const mcx = l10n.getMessageContext(id);

    if (mcx === null) {
      // Use the wrapped component as fallback.
      return children;
    }

    const msg = mcx.getMessage(id);
    const [args, elems] = toArguments(this.props);
    const {
      value: messageValue,
      attrs: messageAttrs
    } = l10n.formatCompound(mcx, msg, args);

    // Check if the fallback is a valid element -- if not then it's not
    // markup (e.g. nothing or a fallback string) so just use the
    // formatted message value
    if (!isValidElement(children)) {
      return messageValue;
    }

    // The default is to forbid all message attributes. If the attrs prop exists
    // on the Localized instance, only set message attributes which have been
    // explicitly allowed by the developer.
    if (attrs && messageAttrs) {
      var localizedProps = {};

      for (const [name, value] of Object.entries(messageAttrs)) {
        if (attrs[name]) {
          localizedProps[name] = value;
        }
      }
    }

    // If the wrapped component is a known void element, explicitly dismiss the
    // message value and do not pass it to cloneElement in order to avoid the
    // "void element tags must neither have `children` nor use
    // `dangerouslySetInnerHTML`" error.
    if (children.type in VOID_ELEMENTS) {
      return cloneElement(children, localizedProps);
    }

    // If the message has a null value, we're only interested in its attributes.
    // Do not pass the null value to cloneElement as it would nuke all children
    // of the wrapped component.
    if (messageValue === null) {
      return cloneElement(children, localizedProps);
    }

    // If the message value doesn't contain any markup nor any HTML entities,
    // insert it as the only child of the wrapped component.
    if (!reMarkup.test(messageValue)) {
      return cloneElement(children, localizedProps, messageValue);
    }

    // If the message contains markup, parse it and try to match the children
    // found in the translation with the props passed to this Localized.
    const translationNodes = Array.from(parseMarkup(messageValue).childNodes);
    const translatedChildren = translationNodes.map(childNode => {
      if (childNode.nodeType === childNode.TEXT_NODE) {
        return childNode.textContent;
      }

      // If the child is not expected just take its textContent.
      if (!elems.hasOwnProperty(childNode.localName)) {
        return childNode.textContent;
      }

      const sourceChild = elems[childNode.localName];

      // If the element passed as a prop to <Localized> is a known void element,
      // explicitly dismiss any textContent which might have accidentally been
      // defined in the translation to prevent the "void element tags must not
      // have children" error.
      if (sourceChild.type in VOID_ELEMENTS) {
        return sourceChild;
      }

      // TODO Protect contents of elements wrapped in <Localized>
      // https://github.com/projectfluent/fluent.js/issues/184
      // TODO  Control localizable attributes on elements passed as props
      // https://github.com/projectfluent/fluent.js/issues/185
      return cloneElement(sourceChild, null, childNode.textContent);
    });

    return cloneElement(children, localizedProps, ...translatedChildren);
  }
}

Localized.contextTypes = {
  l10n: isReactLocalization
};

Localized.propTypes = {
  children: PropTypes.node
};
