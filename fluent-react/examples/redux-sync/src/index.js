import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import AppLocalizationProvider from './l10n';
import App from './App';

ReactDOM.render(
  <Provider store={store}>
    <AppLocalizationProvider>
      <App />
    </AppLocalizationProvider>
  </Provider>,
  document.getElementById('root')
);
