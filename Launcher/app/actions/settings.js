import { exec } from 'child_process';
import { displayError } from './error';

const { dialog, app } = require('electron').remote;
const path = require('path');

export const SELECT_FOLDER = 'SELECT_FOLDER';
export const SELECT_FILE = 'SELECT_FILE';
export const SAVE_SETTINGS = 'SAVE_SETTINGS';
export const CLEAR_CHANGES = 'CLEAR_CHANGES';

export function browseFolder(field) {
  return (dispatch) => {
    const paths = dialog.showOpenDialog({
      properties: ['openDirectory'],
    }) || [];

    const folderPath = paths[0];
    if (!folderPath) {
      return;
    }

    dispatch(selectFolder(field, folderPath));
  };
}

export function selectFolder(field, selectedPath) {
  return {
    type: SELECT_FOLDER,
    payload: {
      field: field,
      path: selectedPath,
    },
  };
}

export function browseFile(field) {
  return (dispatch) => {
    const files = dialog.showOpenDialog({
      properties: ['openFile'],
    }) || [];

    const filePath = files[0];
    if (!filePath) {
      return;
    }

    dispatch(selectFile(field, filePath));
  };
}

export function selectFile(field, selectedPath) {
  return {
    type: SELECT_FILE,
    payload: {
      field: field,
      path: selectedPath,
    },
  };
}

export function saveSettings() {
  return {
    type: SAVE_SETTINGS,
    payload: {},
  };
}

export function clearChanges() {
  return {
    type: CLEAR_CHANGES,
    payload: {},
  };
}

export function openDolphin() {
  return (dispatch) => {
    const platform = process.platform;
    const isDev = process.env.NODE_ENV === "development";

    const appPath = app.getAppPath();

    // This is the path of dolphin after this app has been packaged
    let dolphinPath = path.join(appPath, "../app.asar.unpacked/dolphin");

    // Here we are going to build the platform-specific commands required to launch
    // dolphin from the command line with the correct game
    let commands, command;
    switch (platform) {
    case "darwin": // osx
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/osx" : dolphinPath;

      commands = [
        `cd "${dolphinPath}"`,
        `open "Dolphin.app"`,
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "win32": // windows
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;

      commands = [
        `cd "${dolphinPath}"`,
        `Dolphin.exe`,
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "linux": // linux
      dolphinPath = isDev ? "./app/dolphin-dev/linux" : dolphinPath;

      commands = [
        `cd "${dolphinPath}"`,
        `./dolphin-emu`,
      ];
      
      command = commands.join(' && ');
      break;
    default:
      const error = displayError(
        'settings-global',
        "The current platform is not supported"
      );
      dispatch(error);
      break;
    }

    exec(command, (error) => {
      // Apparently this callback happens before dolphin exits...
      if (error) {
        console.error(`exec error: ${error.message}`);
        dispatch(displayError('settings-global', error.message));
      }
    });
  };
}
