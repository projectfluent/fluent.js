import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';

import reducer from './reducer';

const middlewares = process.env.NODE_ENV === 'development' ?
  [createLogger()] :
  [];

export default createStore(
  reducer,
  applyMiddleware(...middlewares)
);
