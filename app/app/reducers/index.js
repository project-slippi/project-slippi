import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import fileLoader from './fileLoader';

const rootReducer = combineReducers({
  router,
  fileLoader,
});

export default rootReducer;
