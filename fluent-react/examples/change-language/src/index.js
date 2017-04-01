import React from 'react';
import ReactDOM from 'react-dom';

import { AppMessagesProvider } from './l10n';
import App from './App';

ReactDOM.render(
  <AppMessagesProvider requested={navigator.languages}>
    <App />
  </AppMessagesProvider>,
  document.getElementById('root')
);
