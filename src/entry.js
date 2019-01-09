import React from 'react';
import {render} from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';

import thunkMiddleware from 'redux-thunk'
import {createLogger} from 'redux-logger'
import Index from "./containers";

const loggerMiddleware = createLogger();

const rootReducer = (state = [], action) => {
  return state;
};

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
);

render(
  <Provider store={store}>
    <Index/>
  </Provider>,
  document.getElementById('root')
);
