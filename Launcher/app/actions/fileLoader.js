import { displayError } from './error';

export const LOAD_ROOT_FOLDER = 'LOAD_ROOT_FOLDER';
export const CHANGE_FOLDER_SELECTION = 'CHANGE_FOLDER_SELECTION';
export const STORE_SCROLL_POSITION = 'STORE_SCROLL_POSITION';

export function loadRootFolder() {
  return {
    type: LOAD_ROOT_FOLDER,
    payload: {},
  };
}

export function changeFolderSelection(folder) {
  return {
    type: CHANGE_FOLDER_SELECTION,
    payload: {
      folderPath: folder,
    },
  };
}

export function storeScrollPosition(position) {
  return {
    type: STORE_SCROLL_POSITION,
    payload: {
      position: position,
    },
  };
}

export function playFile(file) {
  return (dispatch, getState) => {
    const filePath = file.fullPath;
    if (!filePath) {
      // TODO: Maybe show error message
      return;
    }

    const dolphinManager = getState().fileLoader.dolphinManager;
    dolphinManager.playFile(filePath).catch((err) => {
      const errorAction = displayError(
        'fileLoader-global',
        err.message,
      );

      dispatch(errorAction);
    });
  };
}
