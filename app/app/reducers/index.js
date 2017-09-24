import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import fileLoader from './fileLoader';
import settings from './settings';

const rootReducer = combineReducers({
  router,
  fileLoader,
  settings
});

export default rootReducer;
