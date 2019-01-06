import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import fileLoader from './fileLoader';
import settings from './settings';
import console from './console';
import game from './game';
import errors from './error';

const rootReducer = combineReducers({
  router: router,
  fileLoader: fileLoader,
  settings: settings,
  console: console,
  game: game,
  errors: errors,
});

export default rootReducer;
