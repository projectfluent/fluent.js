import { isValidElement, cloneElement, Component, Children } from 'react';
import PropTypes from 'prop-types';

import { isReactLocalization } from './localization';
import { parseMarkup } from './markup';

/*
 * Prepare props passed to `Localized` for formatting.
 */
function toArguments(props) {
  const args = {};
  const elems = {};

  for (const [propname, propval] of Object.entries(props)) {
    if (propname.startsWith('$')) {
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
    const elem = Children.only(children);

    if (!l10n) {
      // Use the wrapped component as fallback.
      return elem;
    }

    const mcx = l10n.getMessageContext(id);

    if (mcx === null) {
      // Use the wrapped component as fallback.
      return elem;
    }

    const msg = mcx.getMessage(id);
    const [args, elems] = toArguments(this.props);
    const {
      value: messageValue,
      attrs: messageAttrs
    } = l10n.formatCompound(mcx, msg, args);

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

    if (messageValue === null || !messageValue.includes('<')) {
      return cloneElement(elem, localizedProps, messageValue);
    }

    const translationNodes = Array.from(parseMarkup(messageValue).childNodes);
    const translatedChildren = translationNodes.map(childNode => {
      if (childNode.nodeType === childNode.TEXT_NODE) {
        return childNode.textContent;
      }

      // If the child is not expected just take its textContent.
      if (!elems.hasOwnProperty(childNode.localName)) {
        return childNode.textContent;
      }

      return cloneElement(
        elems[childNode.localName],
        // XXX Explicitly ignore any attributes defined in the translation.
        null,
        // Void elements have textContent == "" but React doesn't allow them to
        // have any children so we pass null here for any falsy textContent.
        // This means that an empty element in the translation will always clear
        // any existing children in the element passed in the prop.
        childNode.textContent || null
      );
    });

    return cloneElement(elem, localizedProps, ...translatedChildren);
  }
}

Localized.contextTypes = {
  l10n: isReactLocalization
};

Localized.propTypes = {
  children: PropTypes.element.isRequired,
};
