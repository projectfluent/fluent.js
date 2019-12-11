import { Component, Children } from "react";
import PropTypes from "prop-types";
import ReactLocalization, { isReactLocalization} from "./localization";
import createParseMarkup from "./markup";

/*
 * The Provider component for the `ReactLocalization` class.
 *
 * Exposes a `ReactLocalization` instance to all descendants via React's
 * context feature.  It makes translations available to all localizable
 * elements in the descendant's render tree without the need to pass them
 * explicitly.
 *
 *     <LocalizationProvider bundles={…}>
 *         …
 *     </LocalizationProvider>
 *
 * The `LocalizationProvider` component takes one prop: `bundles`.  It should
 * be an iterable of `FluentBundle` instances in order of the user's
 * preferred languages.  The `FluentBundle` instances will be used by
 * `ReactLocalization` to format translations.  If a translation is missing in
 * one instance, `ReactLocalization` will fall back to the next one.
 */
export default class LocalizationProvider extends Component {
  constructor(props) {
    super(props);
    const {bundles, parseMarkup} = props;

    if (bundles === undefined) {
      throw new Error("LocalizationProvider must receive the bundles prop.");
    }

    if (!bundles[Symbol.iterator]) {
      throw new Error("The bundles prop must be an iterable.");
    }

    this.l10n = new ReactLocalization(bundles);
    this.parseMarkup = parseMarkup || createParseMarkup();
  }

  getChildContext() {
    return {
      l10n: this.l10n,
      parseMarkup: this.parseMarkup,
    };
  }

  componentDidUpdate(prevProps) {
    const { bundles } = this.props;

    if (prevProps.bundles !== bundles) {
      this.l10n.setBundles(bundles);
    }
  }

  render() {
    return Children.only(this.props.children);
  }
}

LocalizationProvider.childContextTypes = {
  l10n: isReactLocalization,
  parseMarkup: PropTypes.func,
};

LocalizationProvider.propTypes = {
  children: PropTypes.element.isRequired,
  bundles: isIterable,
  parseMarkup: PropTypes.func,
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
