import { exec } from 'child_process';
import net from 'net';
import fs from 'fs-extra';
import path from 'path';
import { displayError } from './error';

const { app } = require('electron').remote;
const electronSettings = require('electron-settings');

export default class DolphinManager {
  constructor(key) {
    // The key 
    this.key = key;
    this.isRunning = false;
    this.initCommFiles();
  }

  // TODO: Make private?
  initCommFiles() {
    // TODO: Create file in temp directory
  }

  configureDolphin() {

  }
  
  startPlayback() {
    // Trigger playFile with empty file to boot into
    // Playback wait scene
    this.playFile("");
  }

  playFile(filePath) {
    // TODO: Write filePath to comm file

    
  }

  // TODO: Private
  launchDolphin(startPlayback) {
    if (this.isRunning) {
      // TODO: Bring dolphin into focus
      return;
    }

    // TODO: Better launch code

    const platform = process.platform;
    const isDev = process.env.NODE_ENV === "development";

    const appPath = app.getAppPath();

    // This is the path of dolphin after this app has been packaged
    let dolphinPath = path.join(appPath, "../app.asar.unpacked/dolphin");

    // Get melee file location from settings
    const meleeFile = electronSettings.get('settings.isoPath');
    if (!meleeFile) {
      throw new Error(
        `Files cannot be played without a melee iso selected. Please return to the
        settings page and select a melee iso.`
      );
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
        throw new Error("The current platform is not supported");
    }

    // Ensure the target Slippi folder exists
    fs.ensureDirSync(slippiPath);

    exec(command, (error) => {
      // Apparently this callback happens before dolphin exits...
      if (error) {
        // TODO: Do I need to do this?
        throw error;
      }
    });
  }
}