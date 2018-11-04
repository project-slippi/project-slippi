import net, { Socket } from 'net';
import fs from 'fs-extra';
import path from 'path';

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
      }

      if (!writeStream) {
        // If no active writeStream, don't do anything
        return;
      }

      const dataLen = data.length;
      const gameEndCommandBytePresent = data[dataLen - 2] === 0x39;
      const gameEndPayloadValid = data[dataLen - 1] === 0x0 || data[dataLen - 1] === 0x3;
      if (gameEndCommandBytePresent && gameEndPayloadValid) {
        // TODO: This should instead happen when we detect the end of the game
        writeStream.end();
        writeStream = null;
        // fileIndex += 1;

        console.log("Game end detected.");
      }

      writeStream.write(data);
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
