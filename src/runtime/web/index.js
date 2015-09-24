'use strict';

import { Service } from './service';
import { View } from '../../bindings/html/view';

const service = new Service(navigator.languages);
window.addEventListener('languagechange', service);
document.addEventListener('additionallanguageschange', service);

document.l10n = new View(service, document);
