const fs = require('fs');
const path = require('path');
const electronSettings = require('electron-settings');

import { LOAD_ROOT_FOLDER, CHANGE_FOLDER_SELECTION, DISPLAY_ERROR, DISMISS_ERROR } from '../actions/fileLoader';
import { generateGameInfo } from '../utils/slpReader';

// Default state for this reducer
const defaultState = {
  rootFolderName: "",
  selectedFolderFullPath: "",
  folders: {},
  files: [],
  playingFile: null,
  errorMessages: {},
  errorDisplayFlags: {}
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case LOAD_ROOT_FOLDER:
    return loadRootFolder(state, action);
  case CHANGE_FOLDER_SELECTION:
    return changeFolderSelection(state, action);
  case DISPLAY_ERROR:
    return displayError(state, action);
  case DISMISS_ERROR:
    return dismissError(state, action);
  default:
    return state;
  }
}

function loadRootFolder(state, action) {
  const rootFolder = electronSettings.get('settings.rootSlpPath');
  const files = fs.readdirSync(rootFolder);

  const rootFolderBasename = path.basename(rootFolder);

  // Filter for folders in the root folder
  const subDirectories = files.map((file) => {
    const fullPath = path.join(rootFolder, file);
    return {
      fullPath: fullPath,
      folderName: file,
      pathArr: [rootFolderBasename, file],
      expanded: true,
      subDirectories: {}
    };
  }).filter((folderDetails) => {
    return fs.lstatSync(folderDetails.fullPath).isDirectory();
  });

  let folders = {};
  folders[rootFolderBasename] = {
    fullPath: rootFolder,
    folderName: rootFolderBasename,
    pathArr: [rootFolderBasename],
    expanded: false,
    subDirectories: subDirectories
  };

  // Select the root folder
  const newState = changeFolderSelection(state, {
    payload: {
      folderPath: rootFolder
    }
  });

  // Combine the state we got from selecting a folder
  return {
    ...newState,
    rootFolderName: rootFolderBasename,
    folders: folders
  }
}

function changeFolderSelection(state, action) {
  const folderPath = action.payload.folderPath;
  let files = fs.readdirSync(folderPath) || [];

  // Filter for all .slp files
  files = files.filter((file) => {
    return path.extname(file) === ".slp";
  });

  // Compute header information for display
  files = files.map((file) => {
    const fullPath = path.join(folderPath, file);
    return {
      fullPath: fullPath,
      fileName: file,
      gameInfo: generateGameInfo(fullPath)
    }
  });

  return {
    ...state,
    selectedFolderFullPath: folderPath,
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