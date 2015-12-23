'use strict';

const shadow = document.querySelector('h1').createShadowRoot();
// start observing before inserting any elements into the shadow root
document.l10n.observeRoot(shadow);
shadow.innerHTML = '<p data-l10n-id="hello"></p>';

// when the shadow root is detached from the DOM you need to explicitly
// stop observing it with disconnectRoot:
// document.l10n.disconnectRoot(shadow);
