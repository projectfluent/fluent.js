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
      elems[propname] = propval;
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
    const { id, children } = this.props;
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
    const { value, attrs } = l10n.formatCompound(mcx, msg, args);

    if (value === null || !value.includes('<')) {
      return cloneElement(elem, attrs, value);
    }

    const translationNodes = Array.from(parseMarkup(value).childNodes);
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
        // XXX React breaks if we try to pass non-null children to void elements
        // (like <input>). At the same time, textContent of such elements is an
        // empty string, so we explicitly pass null instead.
        // See https://github.com/projectfluent/fluent.js/issues/105.
        childNode.textContent || null
      );
    });

    return cloneElement(elem, attrs, ...translatedChildren);
  }
}

Localized.contextTypes = {
  l10n: isReactLocalization
};

Localized.propTypes = {
  children: PropTypes.element.isRequired,
};
