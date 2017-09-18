import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import counter from './counter';
import fileLoader from './fileLoader';

const rootReducer = combineReducers({
  router,
  fileLoader,
});

export default rootReducer;
