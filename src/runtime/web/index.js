import { fetchResource } from './io';
import { Env } from '../../lib/env';
import { View } from '../../bindings/html/view';

const env = new Env(fetchResource);
document.l10n = new View(env, document);

window.addEventListener('languagechange', document.l10n);
