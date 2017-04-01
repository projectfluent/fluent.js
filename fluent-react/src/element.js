import {
  isValidElement, cloneElement, Component, Children, PropTypes
} from 'react';
import { MessageArgument } from 'fluent/compat';

class ElementArgument extends MessageArgument {
  valueOf() {
    return this.value;
  }
}

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

export default class LocalizedElement extends Component {
  componentDidMount() {
    const { l10n } = this.context;
    l10n.subscribe(this);
  }

  componentWillUnmount() {
    const { l10n } = this.context;
    l10n.unsubscribe(this);
  }

  render() {
    const elem = Children.only(this.props.children);

    const { l10n: { cx } } = this.context;

    const { id } = this.props;
    const msg = cx.messages.get(id);

    if (!msg) {
      return elem;
    }

    const args = withElements(this.props);
    const parts = cx.formatToParts(msg, args) || [];
    const children = parts.map(part => part.valueOf(cx));
    let attrs;

    if (msg.attrs) {
      attrs = {};
      for (const name of Object.keys(msg.attrs)) {
        attrs[name] = cx.format(msg.attrs[name], args);
      }
    }

    return cloneElement(elem, attrs, ...children);
  }
}

LocalizedElement.contextTypes = {
  l10n: PropTypes.object
};

LocalizedElement.propTypes = {
  children: PropTypes.element.isRequired,
};
