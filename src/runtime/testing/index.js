import LocalizationObserver from '../../bindings/base';
import { getResourceLinks } from '../web/util';

const obs = new LocalizationObserver();

window.L20n = {
  dom: obs,
  getResourceLinks
}
