import React from 'react';
import ReactDOM from 'react-dom';

import { LocalizationProvider, requestMessages } from './l10n';
import App from './App';

ReactDOM.render(
  <LocalizationProvider
    requestMessages={requestMessages}
  >
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
