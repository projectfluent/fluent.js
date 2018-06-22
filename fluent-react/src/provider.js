import { Component, Children } from "react";
import PropTypes from "prop-types";
import { parseMarkup } from "./markup";
import ReactLocalization, { isReactLocalization} from "./localization";

/*
 * The Provider component for the `ReactLocalization` class.
 *
 * Exposes a `ReactLocalization` instance to all descendants via React's
 * context feature.  It makes translations available to all localizable
 * elements in the descendant's render tree without the need to pass them
 * explicitly.
 *
 *     <LocalizationProvider messages={…}>
 *         …
 *     </LocalizationProvider>
 *
 * The `LocalizationProvider` component takes one prop: `messages`.  It should
 * be an iterable of `MessageContext` instances in order of the user's
 * preferred languages.  The `MessageContext` instances will be used by
 * `ReactLocalization` to format translations.  If a translation is missing in
 * one instance, `ReactLocalization` will fall back to the next one.
 */
export default class LocalizationProvider extends Component {
  constructor(props) {
    super(props);
    const { messages } = props;

    if (messages === undefined) {
      throw new Error("LocalizationProvider must receive the messages prop.");
    }

    if (!messages[Symbol.iterator]) {
      throw new Error("The messages prop must be an iterable.");
    }

    this.l10n = new ReactLocalization(messages);
  }

  getChildContext() {
    return {
      l10n: this.l10n,
      parseMarkup: this.props.parseMarkup || parseMarkup
    };
  }

  componentWillReceiveProps(next) {
    const { messages } = next;

    if (messages !== this.props.messages) {
      this.l10n.setMessages(messages);
    }
  }

  render() {
    return Children.only(this.props.children);
  }
}

LocalizationProvider.childContextTypes = {
  l10n: isReactLocalization,
  parseMarkup: PropTypes.func
};

LocalizationProvider.propTypes = {
  children: PropTypes.element.isRequired,
  messages: isIterable,
  parseMarkup: PropTypes.func
};

function isIterable(props, propName, componentName) {
  const prop = props[propName];

  if (Symbol.iterator in Object(prop)) {
    return null;
  }

  return new Error(
    `The ${propName} prop supplied to ${componentName} must be an iterable.`
  );
}
