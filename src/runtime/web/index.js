'use strict';

import { fetchResource } from './io';
import { Client, broadcast } from './bridge';
import { Remote } from '../../bindings/html/remote';
import { View } from '../../bindings/html/view';

const remote = new Remote(fetchResource, broadcast);
const client = new Client(remote);
document.l10n = new View(client, document);

window.addEventListener('languagechange', document.l10n);
document.addEventListener('additionallanguageschange', document.l10n);
