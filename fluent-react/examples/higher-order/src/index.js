import React from 'react';
import ReactDOM from 'react-dom';
import { LocalizationProvider } from 'fluent-react/compat';

import { generateMessages } from './l10n';
import App from './App';

ReactDOM.render(
  <LocalizationProvider messages={generateMessages(navigator.languages)}>
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
