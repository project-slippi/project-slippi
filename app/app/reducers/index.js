import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import fileLoader from './fileLoader';
import settings from './settings';
import game from './game';
import errors from './error';

const rootReducer = combineReducers({
  router,
  fileLoader,
  settings,
  game,
  errors
});

export default rootReducer;
