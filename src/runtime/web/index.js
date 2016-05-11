import { fetchResource } from './io';
import { SimpleContext } from '../../lib/context';
import { View } from '../../bindings/html/view';

const createContext = (...args) => SimpleContext.create(fetchResource, ...args);
document.l10n = new View(createContext, document);

window.addEventListener('languagechange', document.l10n);
