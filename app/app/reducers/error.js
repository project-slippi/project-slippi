import { DISPLAY_ERROR, DISMISS_ERROR } from '../actions/error';

// Default state for this reducer
const defaultState = {
  messages: {},
  displayFlags: {}
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case DISPLAY_ERROR:
    return displayError(state, action);
  case DISMISS_ERROR:
    return dismissError(state, action);
  default:
    return state;
  }
}

function displayError(state, action) {
  let newState = { ...state };

  const key = action.key;
  newState.messages[key] = action.errorMessage;
  newState.displayFlags[key] = true;
  return newState;
}

function dismissError(state, action) {
  let newState = { ...state };

  const key = action.key;
  newState.displayFlags[key] = false;
  return newState;
}