const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Check if the renderer and main bundles are built
function CopyDolphin() {
  const platform = process.platform;

  const targetFolder = "./app/dolphin";

  switch (platform) {
  case "darwin":
    console.log("Copying the mac build of dolphin to package");
    copyForMac(targetFolder);
    break;
  case "win32":
    console.log("Copying the windows build of dolphin to package");
    copyForWindows(targetFolder);
    break;
  default:
    throw new Error("Platform not yet supported.");
  }

  console.log("Finished copying dolphin build!");
}

function copyForMac(targetFolder) {
  const dolphinSource = "./app/dolphin-dev/osx/Dolphin.app";
  if (!fs.existsSync(dolphinSource)) {
    throw new Error("Must have a Dolphin.app application in dolphin-dev/osx folder.");
  }

  const dolphinDest = path.join(targetFolder, 'Dolphin.app');
  const dolphinDestUserFolder = path.join(dolphinDest, 'Contents/Resources/User');
  const dolphinDestSysFolder = path.join(dolphinDest, 'Contents/Resources/Sys');
  const dolphinDestSlippiFolder = path.join(targetFolder, 'Slippi');
  const gitIgnoreDest = path.join(targetFolder, ".gitignore");

  const overwriteUserFolder = "./app/dolphin-dev/overwrite/User";
  const overwriteSysFolder = "./app/dolphin-dev/overwrite/Sys";

  const commands = [
    `rm -rf "${targetFolder}"`,
    `mkdir "${targetFolder}"`,
    `ditto "${dolphinSource}" "${dolphinDest}"`,
    `rm -rf "${dolphinDestUserFolder}"`,
    `ditto "${overwriteUserFolder}" "${dolphinDestUserFolder}"`,
    `ditto "${overwriteSysFolder}" "${dolphinDestSysFolder}"`,
    `rm -rf "${gitIgnoreDest}"`,
    `mkdir "${dolphinDestSlippiFolder}"`,
  ];

  const command = commands.join(' && ');
  execSync(command);
}

function copyForWindows(targetFolder) {
  const sourceFolder = "./app/dolphin-dev/windows";
  const dolphinSource = "./app/dolphin-dev/windows/Dolphin.exe";
  if (!fs.existsSync(dolphinSource)) {
    throw new Error("Must have a Dolphin.exe file in dolphin-dev/windows folder.");
  }

  const dolphinDestUserFolder = path.join(targetFolder, 'User');
  const dolphinDestSysFolder = path.join(targetFolder, 'Sys');
  const dolphinDestSlippiFolder = path.join(targetFolder, 'Slippi');
  const gitIgnoreDest = path.join(targetFolder, ".gitignore");

  const overwriteUserFolder = "./app/dolphin-dev/overwrite/User";
  const overwriteSysFolder = "./app/dolphin-dev/overwrite/Sys";

  fs.emptyDirSync(targetFolder);
  fs.copySync(sourceFolder, targetFolder);
  fs.removeSync(dolphinDestUserFolder);
  fs.copySync(overwriteUserFolder, dolphinDestUserFolder);
  fs.copySync(overwriteSysFolder, dolphinDestSysFolder);
  fs.removeSync(gitIgnoreDest);
  fs.emptyDirSync(dolphinDestSlippiFolder);
}

CopyDolphin();
