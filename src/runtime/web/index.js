'use strict';

import { fetch } from './io';
import { Client, broadcast } from './bridge';
import { Remote } from '../../bindings/html/remote';
import { View } from '../../bindings/html/view';

const remote = new Remote(fetch, broadcast, navigator.languages);
window.addEventListener('languagechange', remote);
document.addEventListener('additionallanguageschange', remote);

document.l10n = new View(
  new Client(remote), document);
