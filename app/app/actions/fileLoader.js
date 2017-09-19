const path = require('path');
const fs = require('fs');
const {dialog} = require('electron').remote;

import { exec } from 'child_process';

export const LOAD_FOLDER = 'LOAD_FOLDER';

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
  return () => {
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

    // Here we are going to build the platform-specific commands required to launch
    // dolphin from the command line with the correct game
    let commands, command, dolphinPath, destinationFile, meleeFile;
    switch (platform) {
    case "darwin": // osx
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin/macOS" : "./app/dolphin";
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
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : "./app/dolphin";
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
      command = commands.join(' & ');
      break;
    }

    exec(command, (error, stdout, stderr) => {
      // Apparently this callback happens before dolphin exits...
      if (error) {
        console.error(`exec error: ${error}`);
      }
    });
  };
}
