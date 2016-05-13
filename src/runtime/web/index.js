import { createSimpleContext } from './api';
import { View } from '../../bindings/html/view';

document.l10n = new View(createSimpleContext, document);

window.addEventListener('languagechange', document.l10n);
