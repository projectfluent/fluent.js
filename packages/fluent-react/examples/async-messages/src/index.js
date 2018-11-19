import React from 'react';
import ReactDOM from 'react-dom';

import { AppLocalizationProvider } from './l10n';
import App from './App';

ReactDOM.render(
  <AppLocalizationProvider userLocales={navigator.languages}>
    <App />
  </AppLocalizationProvider>,
  document.getElementById('root')
);
