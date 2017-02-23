import React from 'react';
import ReactDOM from 'react-dom';

import { LocalizationProvider, negotiateLanguages, requestMessages }
  from './l10n';
import App from './App';

ReactDOM.render(
  <LocalizationProvider
    locales={negotiateLanguages(navigator.language)}
    requestMessages={requestMessages}
  >
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
