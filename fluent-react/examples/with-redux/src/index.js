import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { AppLocalizationProvider, requestMessages } from './l10n';
import store from './store';
import App from './App';

ReactDOM.render(
  <Provider store={store}>
    <AppLocalizationProvider>
      <App />
    </AppLocalizationProvider>
  </Provider>,
  document.getElementById('root')
);
