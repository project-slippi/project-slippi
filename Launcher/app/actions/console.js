import net from 'net';
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
    }, (arg1, arg2, arg3) => {
      console.log("Connected!");
      console.log({
        arg1: arg1,
        arg2: arg2,
        arg3: arg3,
      });
    });

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
        if (writeStream) {
          // TODO: This should instead happen when we detect the end of the game
          writeStream.end();
          writeStream = null;
          fileIndex += 1;
        }

        console.log("Making new file...");
        const filePath = path.join(folder, `file${fileIndex}.bin`);
        console.log(filePath);
        writeStream = fs.createWriteStream(filePath, {
          encoding: 'binary',
        });
      }

      if (!writeStream) {
        return;
      }

      writeStream.write(data);
    });

    client.on('end', () => {
      console.log('disconnect');
    });
  };
}
