const path = require('path');
const fs = require('fs');
const {app} = require('electron').remote;
const electronSettings = require('electron-settings');

import { exec } from 'child_process';


import { displayError } from './error'

export const LOAD_ROOT_FOLDER = 'LOAD_ROOT_FOLDER';
export const CHANGE_FOLDER_SELECTION = 'CHANGE_FOLDER_SELECTION';

export function loadRootFolder() {
  return {
    type: LOAD_ROOT_FOLDER,
    payload: {}
  };
}

export function changeFolderSelection(path) {
  return {
    type: CHANGE_FOLDER_SELECTION,
    payload: {
      folderPath: path
    }
  };
}

export function playFile(file) {
  return (dispatch) => {
    const filePath = file.fullPath;
    if (!filePath) {
      // TODO: Maybe show error message
      return;
    }

    const platform = process.platform;
    const isDev = process.env.NODE_ENV === "development";

    const appPath = app.getAppPath();

    // This is the path of dolphin after this app has been packaged
    let dolphinPath = path.join(appPath, "../app.asar.unpacked/dolphin");

    // Get melee file location from settings
    const meleeFile = electronSettings.get('settings.isoPath');

    // Here we are going to build the platform-specific commands required to launch
    // dolphin from the command line with the correct game
    let commands, command, destinationFile;
    switch (platform) {
    case "darwin": // osx
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/osx" : dolphinPath;
      destinationFile = path.join(dolphinPath, 'Slippi', 'CurrentGame.slp');

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `cp "${filePath}" "${destinationFile}"`,
        `cd "${dolphinPath}"`,
        `open "Dolphin.app" --args -b -e "${meleeFile}"`
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "win32": // windows
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
      destinationFile = path.join(dolphinPath, 'Slippi', 'CurrentGame.slp');

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `copy "${filePath}" "${destinationFile}"`,
        `cd "${dolphinPath}"`,
        `Dolphin.exe /b /e "${meleeFile}"`
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    }

    exec(command, (error, stdout, stderr) => {
      // Apparently this callback happens before dolphin exits...
      if (error) {
        console.error(`exec error: ${error.message}`);
        dispatch(displayError('fileLoader-global', error.message));
      }
    });
  };
}
