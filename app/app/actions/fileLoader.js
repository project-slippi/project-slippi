const path = require('path');
const fs = require('fs');
const {dialog} = require('electron').remote;
const {app} = require('electron').remote;

import { exec } from 'child_process';

export const LOAD_FOLDER = 'LOAD_FOLDER';
export const DISPLAY_ERROR = 'DISPLAY_ERROR';
export const DISMISS_ERROR = 'DISMISS_ERROR';

export function browseFolder() {
  return (dispatch) => {
    const paths = dialog.showOpenDialog({
      properties: ['openDirectory']
    }) || [];

    const folderPath = paths[0];
    if (!folderPath) {
      return;
    }

    dispatch(loadFolder(folderPath));
  };
}

export function loadFolder(folderPath) {
  return {
    type: LOAD_FOLDER,
    path: folderPath
  };
}

export function dismissError(key) {
  return {
    type: DISMISS_ERROR,
    key: key
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

    // For windows
    //const dolphinPath = "D:\\Users\\Fizzi\\Documents\\Github\\Ishiiruka\\Binary\\x64";
    //const meleeFile = "C:\\Dolphin\\Games\\ssbm-v1_02.iso";
    //const command = `D: & cd \"${dolphinPath}\" & Dolphin.exe /b /e \"${meleeFile}\"`;

    // From user:
    // 1) ISO Path
    // 2) Root Path

    const appPath = app.getAppPath();

    // This is the path of dolphin after this app has been packaged
    let dolphinPath = path.join(appPath, "../app.asar.unpacked/dolphin");

    // Here we are going to build the platform-specific commands required to launch
    // dolphin from the command line with the correct game
    let commands, command, destinationFile, meleeFile;
    switch (platform) {
    case "darwin": // osx
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./wdad/app/dolphin-dev/osx" : dolphinPath;
      meleeFile = "$HOME/Documents/Games/melee.iso";
      destinationFile = path.join(dolphinPath, 'Slippi', 'CurrentGame.slp');

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `cp \"${filePath}\" \"${destinationFile}\"`,
        `cd \"${dolphinPath}\"`,
        `open \"Dolphin.app\" --args -b -e \"${meleeFile}\"`
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "win32": // windows
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
      meleeFile = "C:\\Dolphin\\Games\\ssbm-v1_02.iso";
      destinationFile = path.join(dolphinPath, 'Slippi', 'CurrentGame.slp');

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `copy \"${filePath}\" \"${destinationFile}\"`,
        `cd \"${dolphinPath}\"`,
        `Dolphin.exe /b /e \"${meleeFile}\"`
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    }

    exec(command, (error, stdout, stderr) => {
      // Apparently this callback happens before dolphin exits...
      if (error) {
        console.error(`exec error: ${error.message}`);

        dispatch({
          type: DISPLAY_ERROR,
          key: 'global',
          errorMessage: error.message
        });
      }
    });
  };
}
