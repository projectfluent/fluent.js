import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import { LocalizationProvider, negotiateLanguages, requestMessages }
  from './l10n';

ReactDOM.render(
  <LocalizationProvider
    locales={negotiateLanguages(navigator.language)}
    requestMessages={requestMessages}
  >
    <App />
  </LocalizationProvider>,
  document.getElementById('root')
);
