import { fetchResource } from './io';
import { Context } from '../../lib/context';
import { View } from '../../bindings/html/view';

const createContext = (...args) => Context.create(fetchResource, ...args);
document.l10n = new View(createContext, document);

window.addEventListener('languagechange', document.l10n);
