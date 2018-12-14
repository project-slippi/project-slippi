import { SELECT_FOLDER, SELECT_FILE, SAVE_SETTINGS, CLEAR_CHANGES } from '../actions/settings';
import DolphinManager from '../domain/DolphinManager';

const _ = require('lodash');
const electronSettings = require('electron-settings');

const availableSettings = {
  isoPath: {
    location: 'settings.isoPath',
    defaultValue: "",
  },
  rootSlpPath: {
    location: 'settings.rootSlpPath',
    defaultValue: "",
  },
};

// Default state for this reducer
const defaultState = {
  dolphinManager: new DolphinManager("settings"),
  storedSettings: getStoredSettings(),
  currentSettings: getStoredSettings(),
};

function getStoredSettings() {
  return _.mapValues(availableSettings, settingConfig => {
    let value = electronSettings.get(settingConfig.location);
    if (!value) {
      // Ideally I would do this by using the default param of electronSettings.get
      // but it seems like it doesn't work with empty string
      value = settingConfig.defaultValue;
    }
    return value;
  });
}

export default function settings(state = defaultState, action) {
  switch (action.type) {
  case SELECT_FOLDER:
  case SELECT_FILE:
    return selectFileOrFolder(state, action);
  case SAVE_SETTINGS:
    return saveSettings(state, action);
  case CLEAR_CHANGES:
    return clearChanges(state, action);
  default:
    return state;
  }
}

function selectFileOrFolder(state, action) {
  const payload = action.payload || {};

  const newState = { ...state };
  newState.currentSettings[payload.field] = payload.path;

  // electronSettings.deleteAll();

  return newState;
}

function saveSettings(state) {
  const currentSettings = state.currentSettings || {};

  // Commit new changes to electron-settings file
  _.forEach(availableSettings, (settingConfig, key) => {
    const newValue = currentSettings[key];
    electronSettings.set(settingConfig.location, newValue);
  });

  const newState = { ...state };
  newState.storedSettings = currentSettings;

  return newState;
}

function clearChanges(state) {
  const newState = { ...state };

  // Copy the stored settings back into current settings to reset local changes
  newState.currentSettings = { ...state.storedSettings };

  return newState;
}
