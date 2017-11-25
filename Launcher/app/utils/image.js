const path = require('path');
const { app } = require('electron').remote;

export default function getLocalImage(image) {
  const isDev = process.env.NODE_ENV === "development";
  const appPath = app.getAppPath();

  // This is the path of dolphin after this app has been packaged
  let imagePath = path.join(appPath, "../app.asar.unpacked/images");
  if (isDev) {
    // Kind of ridiculous, there's probably a better way to do this
    imagePath = path.join(appPath, "../../../../../../../app/images");
  }

  return path.join(imagePath, image);
}
