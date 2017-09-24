const path = require('path');
const fs = require('fs');
const {dialog} = require('electron').remote;

export const SELECT_FOLDER = 'SELECT_FOLDER';
export const SELECT_FILE = 'SELECT_FILE';
export const SAVE_SETTINGS = 'SAVE_SETTINGS';
export const CLEAR_CHANGES = 'CLEAR_CHANGES';

export function browseFolder(field) {
  return (dispatch) => {
    const paths = dialog.showOpenDialog({
      properties: ['openDirectory']
    }) || [];

    const folderPath = paths[0];
    if (!folderPath) {
      return;
    }

    dispatch(selectFolder(field, folderPath));
  };
}

export function selectFolder(field, path) {
  return {
    type: SELECT_FOLDER,
    payload: {
      field: field,
      path: path
    }
  };
}

export function browseFile(field) {
  return (dispatch) => {
    const files = dialog.showOpenDialog({
        properties: ['openFile']
      }) || [];

    const filePath = files[0];
    if (!filePath) {
      return;
    }

    dispatch(selectFile(field, filePath));
  };
}

export function selectFile(field, path) {
  return {
    type: SELECT_FILE,
    payload: {
      field: field,
      path: path
    }
  };
}

export function saveSettings() {
  return {
    type: SAVE_SETTINGS,
    payload: {}
  };
}

export function clearChanges() {
  return {
    type: CLEAR_CHANGES,
    payload: {}
  }
}
