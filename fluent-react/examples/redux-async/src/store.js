import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

import reducer from './reducer';

const middlewares = process.env.NODE_ENV === 'development' ?
  [thunk, createLogger()] :
  [thunk];

export default createStore(
  reducer,
  applyMiddleware(...middlewares)
);
