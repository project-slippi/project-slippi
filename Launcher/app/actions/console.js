import { exec } from 'child_process';
import net from 'net';
import fs from 'fs-extra';
import path from 'path';
import { displayError } from './error';

const { app } = require('electron').remote;
const electronSettings = require('electron-settings');

export const CONNECTION_CANCEL_EDIT = 'CONNECTION_CANCEL_EDIT';
export const CONNECTION_EDIT = 'CONNECTION_EDIT';
export const CONNECTION_SAVE = 'CONNECTION_SAVE';
export const CONNECTION_DELETE = 'CONNECTION_DELETE';
export const CONNECTION_CONNECT = 'CONNECTION_CONNECT';

export function cancelEditConnection() {
  return {
    type: CONNECTION_CANCEL_EDIT,
    payload: {},
  };
}

export function editConnection(id) {
  return {
    type: CONNECTION_EDIT,
    payload: {
      id: id,
    },
  };
}

export function saveConnection(id, settings) {
  return {
    type: CONNECTION_SAVE,
    payload: {
      id: id,
      settings: settings,
    },
  };
}

export function deleteConnection(id) {
  return {
    type: CONNECTION_DELETE,
    payload: {
      id: id,
    },
  };
}

export function connectConnection(connection) {
  return (dispatch) => {
    const client = net.connect({
      host: connection.ipAddress,
      port: 666,
    }, () => {
      console.log("Connected!");
    });

    client.setTimeout(10000);

    let fileIndex = 1;
    const folder = connection.targetFolder;
    let writeStream = null;
    client.on('data', (data) => {
      if (data.length === 5 && data.toString() === "HELO\0") {
        // This is just a keep-alive message, filter it
        return;
      }

      const firstCommand = data[0];
      if (firstCommand === 0x35) {
        console.log("Making new file...");
        const filePath = path.join(folder, `file${fileIndex}.bin`);
        console.log(filePath);
        writeStream = fs.createWriteStream(filePath, {
          encoding: 'binary',
        });
        writeFileToPlayback(filePath, dispatch);
      }

      if (!writeStream) {
        // If no active writeStream, don't do anything
        return;
      }

      writeStream.write(data);

      const dataLen = data.length;
      const gameEndCommandBytePresent = data[dataLen - 2] === 0x39;
      const gameEndPayloadValid = data[dataLen - 1] === 0x0 || data[dataLen - 1] === 0x3;
      if (gameEndCommandBytePresent && gameEndPayloadValid) {
        writeStream.end();
        writeStream = null;
        fileIndex += 1;

        console.log("Game end detected.");
      }
    });

    client.on('timeout', () => {
      console.log('timeout');
      client.destroy();

      // TODO: Handle auto-reconnect logic
    });

    client.on('error', (error) => {
      console.log('error');
      console.log(error);
      client.destroy();
    });

    client.on('end', () => {
      console.log('disconnect');
    });
  };
}

function writeFileToPlayback(filePath, dispatch) {
  const platform = process.platform;
  const isDev = process.env.NODE_ENV === "development";

  const appPath = app.getAppPath();

  // This is the path of dolphin after this app has been packaged
  let dolphinPath = path.join(appPath, "../app.asar.unpacked/dolphin");

  // Here we are going to build the platform-specific commands required to launch
  // dolphin from the command line with the correct game
  let slippiPath, playbackFile;
  switch (platform) {
  case "darwin": // osx
    // When in development mode, use the build-specific dolphin version
    // In production mode, only the build from the correct platform should exist
    dolphinPath = isDev ? "./app/dolphin-dev/osx" : dolphinPath;
    slippiPath = path.join(dolphinPath, 'Slippi');

    playbackFile = path.join(slippiPath, 'playback.txt');
    fs.writeFileSync(playbackFile, filePath);
    break;
  case "win32": // windows
    // When in development mode, use the build-specific dolphin version
    // In production mode, only the build from the correct platform should exist
    dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
    slippiPath = path.join(dolphinPath, 'Slippi');

    playbackFile = path.join(slippiPath, 'playback.txt');
    fs.writeFileSync(playbackFile, filePath);
    console.log(`Writing to file: ${playbackFile}: ${filePath}`);
    break;
  case "linux":
    dolphinPath = isDev ? "./app/dolphin-dev/linux" : dolphinPath;
    slippiPath = path.join(dolphinPath, 'Slippi');

    playbackFile = path.join(slippiPath, 'playback.txt');
    fs.writeFileSync(playbackFile, filePath);
    break;
  default:
    const error = displayError(
      'fileLoader-global',
      "The current platform is not supported"
    );
    dispatch(error);
    break;
  }
}

export function startMirroring(connection) {
  return (dispatch) => {
    dispatch({
      type: CONNECTION_SAVE,
      payload: {
        id: connection.id,
        settings: {
          ...connection,
          mirroring: true,
        },
      },
    });

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
    let commands, command, slippiPath, playbackFile;
    switch (platform) {
    case "darwin": // osx
      // When in development mode, use the build-specific dolphin version
      // In production mode, only the build from the correct platform should exist
      dolphinPath = isDev ? "./app/dolphin-dev/osx" : dolphinPath;
      slippiPath = path.join(dolphinPath, 'Slippi');

      playbackFile = path.join(slippiPath, 'playback.txt');
      fs.writeFileSync(playbackFile, "");

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
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

      playbackFile = path.join(slippiPath, 'playback.txt');
      fs.writeFileSync(playbackFile, "");

      // 1) Copy file to the playback dolphin build with the name CurrentGame.slp
      // 2) Navigate to dolphin build path
      // 3) Run dolphin with parameters to launch melee directly
      commands = [
        `cd "${dolphinPath}"`,
        `Dolphin.exe /b /e "${meleeFile}"`,
      ];

      // Join the commands with && which will execute the commands in sequence
      command = commands.join(' && ');
      break;
    case "linux":
      dolphinPath = isDev ? "./app/dolphin-dev/linux" : dolphinPath;
      slippiPath = path.join(dolphinPath, 'Slippi');

      playbackFile = path.join(slippiPath, 'playback.txt');
      fs.writeFileSync(playbackFile, "");

      commands = [
        `cd "${dolphinPath}"`,
        `./dolphin-emu -b -e "${meleeFile}"`,
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
