import '../../intl/polyfill';
import LocalizationObserver from '../../bindings/base';
import Localization from '../../lib/localization';
import { getResourceLinks } from '../web/util';
import { ResourceBundle } from './io';

window.L20n = {
  LocalizationObserver,
  getResourceLinks,
  ResourceBundle,
  Localization,
  MessageContext: Intl.MessageContext
}
