const fs = require('fs');
const path = require('path');

import { LOAD_FOLDER, PLAY_FILE } from '../actions/fileLoader';
import { generateGameInfo } from '../utils/slpReader';

// Default state for this reducer
const defaultState = {
  currentFolder: null,
  files: [],
  playingFile: null
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
    case LOAD_FOLDER:
      return loadFolder(state, action);
    case PLAY_FILE:
      return playFile(state, action);
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

function playFile(state, action) {

}