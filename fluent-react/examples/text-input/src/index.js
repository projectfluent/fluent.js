import React from 'react';
import ReactDOM from 'react-dom';

import { MessagesProvider } from 'fluent-react/compat';
import { negotiateAvailable, MESSAGES_ALL } from './l10n';

import App from './App';

// Choose an array of available locales that are best for the user, in order of
// their preference.
const locales = negotiateAvailable(navigator.languages);

// Choose the right translations for the user's first preferred locales.  In
// this example, this happens synchronously and only for the first locale, but
// other approaches are also valid and possible.
const messages = MESSAGES_ALL[locales[0]];

ReactDOM.render(
  <MessagesProvider locales={locales} messages={messages}>
    <App />
  </MessagesProvider>,
  document.getElementById('root')
);
