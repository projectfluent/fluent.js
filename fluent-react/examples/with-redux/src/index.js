import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { LocalizationProvider, requestMessages } from './l10n';
import store from './store';
import App from './App';

ReactDOM.render(
  <Provider store={store}>
    <LocalizationProvider
      requestMessages={requestMessages}
    >
      <App />
    </LocalizationProvider>
  </Provider>,
  document.getElementById('root')
);
