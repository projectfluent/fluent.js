import React from 'react';
import ReactDOM from 'react-dom';
import { LocalizationProvider } from 'fluent-react';

import { generateMessages } from './l10n';
import App from './App';

ReactDOM.render(
  <LocalizationProvider messages={generateMessages()}>
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
