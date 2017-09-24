const _ = require('lodash');
const electronSettings = require('electron-settings');

import { SELECT_FOLDER, SELECT_FILE, SAVE_SETTINGS, CLEAR_CHANGES } from '../actions/settings';

const availableSettings = {
  isoPath: {
    location: 'settings.isoPath',
    defaultValue: ""
  },
  rootSlpPath: {
    location: 'settings.rootSlpPath',
    defaultValue: ""
  }
};

// Default state for this reducer
const defaultState = {
  storedSettings: getStoredSettings(),
  currentSettings: getStoredSettings()
};

function getStoredSettings() {
  return _.mapValues(availableSettings, function (settingConfig) {
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

  let newState = { ...state };
  newState.currentSettings[payload.field] = payload.path;
  return newState;
}

function saveSettings(state, action) {
  const currentSettings = state.currentSettings || {};

  // Commit new changes to electron-settings file
  _.forEach(availableSettings, function (settingConfig, key) {
    const newValue = currentSettings[key];
    electronSettings.set(settingConfig.location, newValue);
  });

  let newState = { ...state };
  newState.storedSettings = currentSettings;

  return newState;
}

function clearChanges(state, action) {
  let newState = { ...state };
  newState.currentSettings = state.storedSettings;

  return newState;
}