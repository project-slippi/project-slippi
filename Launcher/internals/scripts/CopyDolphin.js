const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// Check if the renderer and main bundles are built
function CopyDolphin() {
  const platform = process.platform;

  const targetFolder = "./app/dolphin";

  // TODO: Create empty Slippi folder
  // TODO: Clear out cache and overwrite user folder
  let command;
  switch (platform) {
  case "darwin":
    console.log("Copying the mac build of dolphin to package");
    command = getMacCommand(targetFolder);
    break;
  case "win32":
    console.log("Copying the windows build of dolphin to package");
    command = getWindowsCommand(targetFolder);
    break;
  default:
    throw new Error("Platform not yet supported.");
  }

  execSync(command);
  console.log("Finished copying dolphin build!");
}

function getMacCommand(targetFolder) {
  const dolphinSource = "./app/dolphin-dev/osx/Dolphin.app";
  if (!existsSync(dolphinSource)) {
    throw new Error("Must have a Dolphin.app application in dolphin-dev/osx folder.");
  }

  const dolphinDest = path.join(targetFolder, 'Dolphin.app');
  const dolphinDestUserFolder = path.join(dolphinDest, 'Contents/Resources/User');
  const dolphinDestSysFolder = path.join(dolphinDest, 'Contents/Resources/Sys');
  const dolphinDestSlippiFolder = path.join(targetFolder, 'Slippi');

  const overwriteUserFolder = "./app/dolphin-dev/overwrite/User";
  const overwriteSysFolder = "./app/dolphin-dev/overwrite/Sys";

  const commands = [
    `rm -rf "${targetFolder}"`,
    `mkdir "${targetFolder}"`,
    `ditto "${dolphinSource}" "${dolphinDest}"`,
    `rm -rf "${dolphinDestUserFolder}"`,
    `ditto "${overwriteUserFolder}" "${dolphinDestUserFolder}"`,
    `ditto "${overwriteSysFolder}" "${dolphinDestSysFolder}"`,
    `mkdir "${dolphinDestSlippiFolder}"`,
  ];

  return commands.join(' && ');
}

function getWindowsCommand(targetFolder) {
  const sourceFolder = "./app/dolphin-dev/windows";
  const dolphinSource = "./app/dolphin-dev/windows/Dolphin.exe";
  if (!existsSync(dolphinSource)) {
    throw new Error("Must have a Dolphin.exe file in dolphin-dev/windows folder.");
  }

  const dolphinDestUserFolder = path.join(targetFolder, 'User');
  const dolphinDestSysFolder = path.join(targetFolder, 'Sys');
  const dolphinDestSlippiFolder = path.join(targetFolder, 'Slippi');

  const overwriteUserFolder = "./app/dolphin-dev/overwrite/User";
  const overwriteSysFolder = "./app/dolphin-dev/overwrite/Sys";

  const commands = [
    `rmdir "${targetFolder}" /Q /S`,
    `mkdir "${targetFolder}"`,
    `robocopy "${sourceFolder}" "${targetFolder}"`,
    `robocopy "${overwriteUserFolder}" "${dolphinDestUserFolder}" /E`,
    `robocopy "${overwriteSysFolder}" "${dolphinDestSysFolder}" /E`,
    `mkdir "${dolphinDestSlippiFolder}"`,
  ];

  return commands.join(' && ');
}

CopyDolphin();
