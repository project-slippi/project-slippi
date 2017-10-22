const fs = require('fs');

const gameInfoBlockByteCount = 312;

const messageSizesCommand = 0x35;

// This function will extract only header info from an slp file. Should be rather efficient.
export function generateGameInfo(path) {
  // TODO: Make this function backwards compatible and cleaner

  const fd = fs.openSync(path, "r");

  const rawDataPosition = getRawDataPosition(fd);
  const rawDataLength = getRawDataLength(fd, rawDataPosition);
  const messageSizes = getMessageSizes(fd, rawDataPosition);

  // TODO: Handle case where file doesn't exist or permissions are insufficient

  let messageSizesLength = messageSizes[messageSizesCommand];
  messageSizesLength = messageSizesLength ? messageSizesLength + 1 : 0;
  const startReadAt = rawDataPosition + 1 + messageSizesLength;
  let buffer = new Uint8Array(320);
  fs.readSync(fd, buffer, 0, buffer.length, startReadAt);

  // Get version number and game info block
  const version = buffer.slice(0, 4);
  const gameInfoBlock = buffer.slice(5, gameInfoBlockByteCount + 5);

  // Get the last frame update to determine the duration of the game
  // Will read from the file at an offset from the end to remove the
  // game end message and start at the last frame update
  const frameUpdateSize = messageSizes[0x38];
  buffer = new Uint8Array(frameUpdateSize);
  const readPos = rawDataPosition + rawDataLength - 2 - frameUpdateSize;
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

export function extractGameContent(path) {
  const fd = fs.openSync(path, "r");

  const rawDataPosition = getRawDataPosition(fd);
  const rawDataLength = getRawDataLength(fd);
  const messageSizes = getMessageSizes(fd, rawDataPosition);

  // Read entire raw data block. Perhaps if this ends up being
  // a bad idea a stream could be used instead
  const buffer = new Uint8Array(rawDataLength);
  fs.readSync(fd, buffer, 0, buffer.length, rawDataPosition);


}

// This function gets the position where the raw data starts
function getRawDataPosition(fd) {
  const buffer = new Uint8Array(1);
  fs.readSync(fd, buffer, 0, buffer.length, 0);

  if (buffer[0] === 0x36) {
    return 0;
  }

  if (buffer[0] !== '{'.charCodeAt(0)) {
    return 0; // return error?
  }

  return 15;
}

function getRawDataLength(fd, position) {
  if (position === 0) {
    const fileStats = fs.fstatSync(fd) || {};
    return fileStats.size;
  }

  const buffer = new Uint8Array(4);
  fs.readSync(fd, buffer, 0, buffer.length, position - 4);

  return buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3];
}

function getMessageSizes(fd, position) {
  // Support old file format
  if (position === 0) {
    return {
      0x36: 0x140,
      0x37: 0x6,
      0x38: 0x46,
      0x39: 0x1
    };
  }

  const buffer = new Uint8Array(2);
  fs.readSync(fd, buffer, 0, buffer.length, position);
  if (buffer[0] !== messageSizesCommand) {
    return {};
  }

  const payloadLength = buffer[1];
  const messageSizes = {
    0x35: payloadLength
  };

  const messageSizesBuffer = new Uint8Array(payloadLength - 1);
  fs.readSync(fd, messageSizesBuffer, 0, messageSizesBuffer.length, position + 2);
  for (let i = 0; i < payloadLength - 1; i += 3) {
    const command = messageSizesBuffer[i];

    // Get size of command
    messageSizes[command] = messageSizesBuffer[i + 1] << 8 | messageSizesBuffer[i + 2];
  }

  return messageSizes;
}