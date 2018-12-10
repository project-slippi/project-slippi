import DolphinManager from './DolphinManager';

class ConsoleConnection {
    constructor(id, settings) {
      this.id = id;
      this.settings = settings;

      // A connection can mirror its received gameplay
      this.dolphinManager = new DolphinManager(`mirror-${id}`);
    }

    getDolphinManager() {
      return this.dolphinManager;
    }

    connect() {

    }
}