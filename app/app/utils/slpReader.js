const fs = require('fs');

const gameInfoBlockByteCount = 312;

// This function will extract only header info from an slp file. Should be rather efficient.
export function generateGameInfo(path) {
  // TODO: Make this function backwards compatible and cleaner

  const fd = fs.openSync(path, "r");

  // TODO: Handle case where file doesn't exist or permissions are insufficient

  let buffer = new Uint8Array(320);
  fs.readSync(fd, buffer, 0, buffer.length, 1);

  // Get version number and game info block
  const version = buffer.slice(0, 4);
  const gameInfoBlock = buffer.slice(5, gameInfoBlockByteCount + 5);

  // Get file stats
  const fileStats = fs.fstatSync(fd) || {};
  const fileSize = fileStats.size;

  // Get the last frame update to determine the duration of the game
  // Will read from the file at an offset from the end to remove the
  // game end message and start at the last frame update
  buffer = new Uint8Array(70);
  const readPos = fileSize - 2 - 70;
  fs.readSync(fd, buffer, 0, buffer.length, readPos);
  const totalFrames = buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3];

  // Create duration string with the format mm:ss
  // In the future perhaps consider using moment
  const totalSeconds = totalFrames / 60;
  const totalMinutes = totalSeconds / 60;
  const minutesDisplay = Math.floor(totalMinutes);
  let secondsDisplay = Math.floor(totalSeconds) % 60;
  secondsDisplay = secondsDisplay < 10 ? `0${secondsDisplay}` : `${secondsDisplay}`;
  const duration = `${minutesDisplay}:${secondsDisplay}`;

  // Get characters in the game
  const characterIds = getCharacters(gameInfoBlock);

  return {
    version: version,
    stageId: gameInfoBlock[14],
    totalFrames: totalFrames,
    duration: duration,
    characterIds: characterIds
  };
}

function getCharacters(gameInfoBlock) {
  const firstCharacterIndex = 95;
  const playerOffset = 36;

  // TODO: Figure out sheik
  return [0, 1, 2, 3].map(function (playerIdx) {
    const characterIndex = firstCharacterIndex + (playerIdx * playerOffset);
    const characterId = gameInfoBlock[characterIndex];
    const playerType = gameInfoBlock[characterIndex + 1];

    // Check if there is no player in this slot, if not return null as the character
    if (playerType === 3) {
      return null;
    }

    return characterId;
  });
}