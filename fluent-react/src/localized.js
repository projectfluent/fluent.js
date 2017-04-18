import { isValidElement, cloneElement, Component, Children } from 'react';
import PropTypes from 'prop-types';
import { MessageArgument } from 'fluent/compat';

import Localization from './localization';

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
function withElements(props) {
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
  constructor(props, context) {
    super(props, context);
    this.state = {
      mcx: this.getMessageContext()
    };
  }

  componentDidMount() {
    const { l10n } = this.context;
    l10n.subscribe(this);
  }

  componentWillUnmount() {
    const { l10n } = this.context;
    l10n.unsubscribe(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.id !== this.props.id) {
      this.setState({ mcx: this.getMessageContext() });
    }
  }

  /*
   * Find the best `MessageContext` in the `Localization` exposed to this
   * component.
   */
  getMessageContext() {
    const { l10n } = this.context;

    if (!l10n) {
      throw new Error(
        'Localized must be a descendant of a LocalizationProvider.'
      );
    }

    const { id } = this.props;

    if (!id) {
      return null;
    }

    return l10n.getMessageContext(id);
  }

  /*
   * Rerender this component in a new language.
   */
  relocalize() {
    // When the `Localization`'s fallback chain changes, update the
    // `MessageContext` instance cached in the component's state and
    // force-render.
    this.setState({ mcx: this.getMessageContext() });
    this.forceUpdate();
  }

  render() {
    const { id, children } = this.props;
    const { mcx } = this.state;
    const elem = Children.only(children);

    if (mcx === null) {
      // Use the wrapped component as the ultimate fallback.
      return elem;
    }

    const msg = mcx.getMessage(id);
    const args = withElements(this.props);
    const parts = mcx.formatToParts(msg, args) || [];

    // Format the parts using the current `MessageContext` instance.
    const childValues = parts.map(part => part.valueOf(mcx));

    if (msg.attrs) {
      var attrs = {};
      for (const name of Object.keys(msg.attrs)) {
        attrs[name] = mcx.format(msg.attrs[name], args);
      }
    }

    // The formatted parts can be passed to `cloneElements` as arguments.  They
    // will be used as children of the cloned element.
    return cloneElement(elem, attrs, ...childValues);
  }
}

Localized.contextTypes = {
  l10n: isLocalization
};

Localized.propTypes = {
  children: PropTypes.element.isRequired,
};

function isLocalization(props, propName) {
  const prop = props[propName];

  if (prop instanceof Localization) {
    return null;
  }

  return new Error(
    `The ${propName} context field must be an instance of Localization.`
  );
}
