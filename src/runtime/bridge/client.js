import { Client, channel } from './bridge';
import { View } from '../../bindings/html/view';

const client = new Client({
  service: 'l20n',
  endpoint: channel,
  timeout: false
});

document.l10n = new View(client, document);

window.addEventListener('pageshow', () => client.connect());
window.addEventListener('pagehide', () => client.disconnect());
window.addEventListener('languagechange', document.l10n);
