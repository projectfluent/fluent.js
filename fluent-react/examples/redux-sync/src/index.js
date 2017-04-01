import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import AppMessagesProvider from './l10n';
import App from './App';

ReactDOM.render(
  <Provider store={store}>
    <AppMessagesProvider>
      <App />
    </AppMessagesProvider>
  </Provider>,
  document.getElementById('root')
);
