import { exec } from 'child_process';
import { displayError } from './error';

const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron').remote;
const electronSettings = require('electron-settings');

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
    if (!meleeFile) {
      const noIsoError = displayError(
        'fileLoader-global',
        `Files cannot be played without a melee iso selected. Please return to the
          settings page and select a melee iso.`
      );

      dispatch(noIsoError);
      return;
    }

    // Here we are going to build the platform-specific commands required to launch
    // dolphin from the command line with the correct game
    let commands, command, slippiPath, destinationFile;
    switch (platform) {
    case "darwin": // osx
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/osx" : dolphinPath;
      slippiPath = path.join(dolphinPath, 'Slippi');
      destinationFile = path.join(slippiPath, 'CurrentGame.slp');

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `cp "${filePath}" "${destinationFile}"`,
        `cd "${dolphinPath}"`,
        `open "Dolphin.app" --args -b -e "${meleeFile}"`,
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "win32": // windows
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
      slippiPath = path.join(dolphinPath, 'Slippi');
      destinationFile = path.join(slippiPath, 'CurrentGame.slp');

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `copy "${filePath}" "${destinationFile}"`,
        `cd "${dolphinPath}"`,
        `Dolphin.exe /b /e "${meleeFile}"`,
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "linux":
      dolphinPath = isDev ? "./app/dolphin-dev/linux" : dolphinPath;
      slippiPath = path.join(dolphinPath, 'Slippi');
      destinationFile = path.join(slippiPath, 'CurrentGame.slp');
      commands = [
        `cp "${filePath}" "${destinationFile}"`,
        `cd "${dolphinPath}"`,
        `./Ishiiruka/Build/Binaries/dolphin-emu -b -e "${meleeFile}"`,
      ];
      command = commands.join(' && ');
    break;
    default:
      const error = displayError(
        'fileLoader-global',
        "The current platform is not supported"
      );
      dispatch(error);
      break;
    }

    // Ensure the target Slippi folder exists
    fs.ensureDirSync(slippiPath);

    exec(command, (error) => {
      // Apparently this callback happens before dolphin exits...
      if (error) {
        console.error(`exec error: ${error.message}`);
        dispatch(displayError('fileLoader-global', error.message));
      }
    });
  };
}
