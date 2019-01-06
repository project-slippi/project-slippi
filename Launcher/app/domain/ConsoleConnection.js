import net from 'net';
import fs from 'fs-extra';
import path from 'path';

import DolphinManager from './DolphinManager';

export const ConnectionStatus = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  RECONNECTING: 2,
};

export default class ConsoleConnection {
  static connectionCount = 0;

  constructor(settings = {}) {
    ConsoleConnection.connectionCount += 1;

    this.id = ConsoleConnection.connectionCount;
    this.ipAddress = settings.ipAddress;
    this.targetFolder = settings.targetFolder;

    this.isMirroring = false;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;

    // A connection can mirror its received gameplay
    this.dolphinManager = new DolphinManager(`mirror-${this.id}`);
  }

  getSettings() {
    return {
      ipAddress: this.ipAddress,
      targetFolder: this.targetFolder,
    };
  }

  editSettings(newSettings) {
    this.ipAddress = newSettings.ipAddress;
    this.targetFolder = newSettings.targetFolder;
  }

  getDolphinManager() {
    return this.dolphinManager;
  }

  connect() {
    const client = net.connect({
      host: this.ipAddress,
      port: 666,
    }, () => {
      console.log(`Connected to ${this.ipAddress}!`);
      this.connectionStatus = ConnectionStatus.CONNECTED;
    });

    client.setTimeout(10000);

    let fileIndex = 1;
    const folder = this.targetFolder;
    let writeStream = null;
    client.on('data', (data) => {
      if (data.length === 5 && data.toString() === "HELO\0") {
        // TODO: Deal with potential HELO messages within payloads
        // This is just a keep-alive message, filter it
        return;
      }

      const firstCommand = data[0];
      if (firstCommand === 0x35) {
        console.log("Making new file...");
        // TODO: 1) Make file name include time based string
        // TODO: 2) Make file type .slp
        const filePath = path.join(folder, `file${fileIndex}.bin`);
        console.log(filePath);
        writeStream = fs.createWriteStream(filePath, {
          encoding: 'binary',
        });

        if (this.isMirroring) {
          // TODO: Handle errors or something?
          this.dolphinManager.playFile(filePath);
        }
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
      console.log(`Timeout on ${this.ipAddress}`);
      client.destroy();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;

      // TODO: Handle auto-reconnect logic
    });

    client.on('error', (error) => {
      console.log('error');
      console.log(error);
      client.destroy();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
    });

    client.on('end', () => {
      console.log('disconnect');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
    });
  }

  async startMirroring() {
    try {
      console.log("Mirroring start");
      this.isMirroring = true;
      await this.dolphinManager.startPlayback();
    } finally {
      console.log("Mirroring end");
      this.isMirroring = false;
    }
  }
}
