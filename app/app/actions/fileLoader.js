const path = require('path');
const fs = require('fs');
const {dialog} = require('electron').remote;

import { exec } from 'child_process';

export const LOAD_FOLDER = 'LOAD_FOLDER';
export const PLAY_FILE_START = 'PLAY_FILE_START';
export const PLAY_FILE_END = 'PLAY_FILE_END';

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

export function playFile(file) {
  return (dispatch) => {
    const filePath = file.fullPath;
    if (!filePath) {
      // TODO: Maybe show error message
      return;
    }

    // For windows
    //const dolphinPath = "D:\\Users\\Fizzi\\Documents\\Github\\Ishiiruka\\Binary\\x64";
    //const meleeFile = "C:\\Dolphin\\Games\\ssbm-v1_02.iso";
    //const command = `D: & cd \"${dolphinPath}\" & Dolphin.exe /b /e \"${meleeFile}\"`;

    // For osx
    const dolphinPath = "$HOME/Documents/Slippi/Launcher";
    const appName = "Dolphin Slippi.app";
    const meleeFile = "$HOME/Documents/Games/melee.iso";
    const commands = [
      `cd \"${dolphinPath}\"`,
      `open \"${appName}\" --args /b /e \"${meleeFile}\"`
    ];
    const command = commands.join(' & ');

    // First copy the selected file over to the Slippi folder of the playback dolphin
    const destinationFile = path.join(dolphinPath, 'Slippi', 'CurrentGame.slp');
    fs.copyFileSync(filePath, destinationFile);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
      }

      dispatch({
        type: PLAY_FILE_END,
        path: path
      });
    });
  };
}