import '../../intl/polyfill';
import DocumentLocalization from '../../bindings/document_localization';
import DOMLocalization from '../../bindings/dom_localization';
import { getResourceLinks } from '../web/util';
import { ResourceBundle } from './io';

window.L20n = {
  DocumentLocalization,
  DOMLocalization,
  getResourceLinks,
  ResourceBundle,
  MessageContext: Intl.MessageContext
};
