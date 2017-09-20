const fs = require('fs');
const path = require('path');

import { LOAD_FOLDER, DISPLAY_ERROR, DISMISS_ERROR } from '../actions/fileLoader';
import { generateGameInfo } from '../utils/slpReader';

// Default state for this reducer
const defaultState = {
  currentFolder: null,
  files: [],
  playingFile: null,
  errorMessages: {},
  errorDisplayFlags: {}
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case LOAD_FOLDER:
    return loadFolder(state, action);
  case DISPLAY_ERROR:
    return displayError(state, action);
  case DISMISS_ERROR:
    return dismissError(state, action);
  default:
    return state;
  }
}

function loadFolder(state, action) {
  let files = fs.readdirSync(action.path) || [];

  // Filter for all .slp files
  files = files.filter((file) => {
    return path.extname(file) === ".slp";
  });

  // Compute header information for display
  files = files.map((file) => {
    const fullPath = path.join(action.path, file);
    return {
      fullPath: fullPath,
      fileName: file,
      gameInfo: generateGameInfo(fullPath)
    }
  });

  return {
    ...state,
    currentFolder: action.path,
    files: files
  }
}

function displayError(state, action) {
  let newState = { ...state };

  const key = action.key;
  newState.errorMessages[key] = action.errorMessage;
  newState.errorDisplayFlags[key] = true;
  return newState;
}

function dismissError(state, action) {
  let newState = { ...state };

  const key = action.key;
  newState.errorDisplayFlags[key] = false;
  return newState;
}