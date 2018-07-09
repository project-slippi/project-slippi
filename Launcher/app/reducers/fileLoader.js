import SlippiGame from 'slp-parser-js';
import {
  LOAD_ROOT_FOLDER, CHANGE_FOLDER_SELECTION, STORE_SCROLL_POSITION, CHANGE_PAGE_NUMBER,
} from '../actions/fileLoader';

const fs = require('fs');
const path = require('path');
const electronSettings = require('electron-settings');

// Default state for this reducer
const defaultState = {
  rootFolderName: "",
  selectedFolderFullPath: "",
  folders: {},
  files: [],
  playingFile: null,
  scrollPosition: {
    x: 0,
    y: 0,
  },
  numberOfPages: 0,
  selectedFilePage: [],
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case LOAD_ROOT_FOLDER:
    return loadRootFolder(state, action);
  case CHANGE_FOLDER_SELECTION:
    return changeFolderSelection(state, action);
  case STORE_SCROLL_POSITION:
    return storeScrollPosition(state, action);
  case CHANGE_PAGE_NUMBER:
    return changePageNumber(state, action);
  default:
    return state;
  }
}

function changePageNumber(state, action) {
  const { files } = state;
  return {
    ...state,
    selectedFilePage: files[action.payload.value],
  };
}

function loadRootFolder(state) {
  const rootFolder = electronSettings.get('settings.rootSlpPath');
  if (!rootFolder) {
    return state;
  }

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
      subDirectories: {},
    };
  }).filter(folderDetails => (
    fs.lstatSync(folderDetails.fullPath).isDirectory()
  ));

  const folders = {};
  folders[rootFolderBasename] = {
    fullPath: rootFolder,
    folderName: rootFolderBasename,
    pathArr: [rootFolderBasename],
    expanded: false,
    subDirectories: subDirectories,
  };

  // Maintain selection if there is one and it is for a loaded sub-directory
  const subDirectoriesByFullPath = _.keyBy(subDirectories, 'fullPath') || {};
  let previouslySelectedFolderFullPath = null;
  if (subDirectoriesByFullPath[state.selectedFolderFullPath]) {
    previouslySelectedFolderFullPath = state.selectedFolderFullPath;
  }

  const folderSelection = previouslySelectedFolderFullPath || rootFolder;

  // Select the root folder
  const newState = changeFolderSelection(state, {
    payload: {
      folderPath: folderSelection,
    },
  });

  // Combine the state we got from selecting a folder
  return {
    ...newState,
    rootFolderName: rootFolderBasename,
    folders: folders,
  };
}

function changeFolderSelection(state, action) {
  const folderPath = action.payload.folderPath;
  let files = fs.readdirSync(folderPath) || [];

  // Filter for all .slp files
  files = files.filter(file => (
    path.extname(file) === ".slp"
  ));

  // Compute header information for display
  files = files.map((file) => {
    const fullPath = path.join(folderPath, file);
    const game = new SlippiGame(fullPath);

    // Pre-load settings here
    game.getSettings();
    game.getMetadata();

    return {
      fullPath: fullPath,
      fileName: file,
      game: game,
    };
  });
  const numberOfPages = Math.ceil(files.length / 10);
  const paginatedFiles = [];
  for (let pagesX = 0; pagesX <= numberOfPages; pagesX++) {
    // array to be pushed into paginatedFiles

    const page = [];
    const filesPerPage = files.length > 10 ? 10 : files.length;

    for (let fileY = 0; fileY < filesPerPage; fileY++) {
      if (files[fileY]) {
        page.push(files[fileY]);
        files.shift();
      }
    }
    paginatedFiles.push(page);
  }

  return {
    ...state,
    numberOfPages: numberOfPages,
    selectedFolderFullPath: folderPath,
    files: paginatedFiles,
    selectedFilePage: paginatedFiles[0],
  };
}

function storeScrollPosition(state, action) {
  return {
    ...state,
    scrollPosition: action.payload.position,
  };
}
