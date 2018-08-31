import React from 'react';
import ReactDOM from 'react-dom';
import { LocalizationProvider } from 'fluent-react/compat';

import { generateBundles } from './l10n';
import App from './App';

ReactDOM.render(
  <LocalizationProvider bundles={generateBundles()}>
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
