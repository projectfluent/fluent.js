import { isValidElement, cloneElement, Component, Children } from 'react';
import PropTypes from 'prop-types';
import { MessageArgument } from 'fluent/compat';

import { isReactLocalization } from './localization';

/*
 * A Fluent argument type for React elements.
 *
 * When `MessageContext`'s `formatToParts` method is used, any interpolations
 * which are valid `MessageArgument` instances are returned unformatted.  The
 * parts can then be `valueOf`'ed and concatenated to create the final
 * translation.
 *
 * With `ElementArgument` it becomes possible to pass React elements as
 * arguments to translations.  This may be useful for passing links or buttons,
 * or in general: elements with logic which should be defined in the app.
 */
class ElementArgument extends MessageArgument {
  valueOf() {
    return this.value;
  }
}

/*
 * Prepare props passed to `Localized` for formetting.
 *
 * Filter props which are not intended for formatting and turn arguments which
 * are React elements into `ElementArgument` instances.
 *
 */
function toArguments(props) {
  const args = {};

  for (const propname of Object.keys(props)) {
    if (!propname.startsWith('$')) {
      continue;
    }

    const arg = props[propname];
    const name = propname.substr(1);

    if (isValidElement(arg)) {
      args[name] = new ElementArgument(arg);
    } else {
      args[name] = arg;
    }
  }

  return args;
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
    const args = toArguments(this.props);
    const { parts, attrs } = l10n.formatCompound(mcx, msg, args);

    // The formatted parts can be passed to `cloneElements` as arguments.  They
    // will be used as children of the cloned element.
    return cloneElement(elem, attrs, ...parts);
  }
}

Localized.contextTypes = {
  l10n: isReactLocalization
};

Localized.propTypes = {
  children: PropTypes.element.isRequired,
};
