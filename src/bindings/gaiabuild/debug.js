'use strict';

import { L10nError } from '../../lib/errors';

export function addBuildMessage(msgs, type, e) {
  if (!(type in msgs)) {
    msgs[type] = [];
  }
  if (e instanceof L10nError &&
        msgs[type].indexOf(e.id) === -1) {
    msgs[type].push(e.id);
  }
}

export function flushBuildMessages(msgs, variant) {
  for (var type in msgs) {
    let messages = msgs[type];
    if (messages.length) {
      console.log('[l10n] [' + 'pl' +
                  ']: ' + messages.length + ' missing ' + variant + ': ' +
                  messages.join(', '));
      msgs[type] = [];
    }
  }
}
