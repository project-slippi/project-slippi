import electronSettings from 'electron-settings';
import _ from 'lodash';

import ConsoleConnection from '../domain/ConsoleConnection';

import {
  CONNECTION_CANCEL_EDIT, CONNECTION_EDIT, CONNECTION_SAVE, CONNECTION_DELETE,
  CONNECTION_CONNECT,
} from '../actions/console';

const connectionPath = "connections";

const defaultState = {
  connections: getStoredConnections(),
  connectionSettingsToEdit: null,
};

function getStoredConnections() {
  const serializedConnections = electronSettings.get(connectionPath) || [];
  return _.map(serializedConnections, (serializedConnection) => (
    new ConsoleConnection(serializedConnection)
  ));
}

export default function connections(state = defaultState, action) {
  switch (action.type) {
  case CONNECTION_EDIT:
    return editConnection(state, action);
  case CONNECTION_CANCEL_EDIT:
    return cancelEditConnection(state, action);
  case CONNECTION_SAVE:
    return saveConnection(state, action);
  case CONNECTION_DELETE:
    return deleteConnection(state, action);
  case CONNECTION_CONNECT:
    return connectConnection(state, action);
  default:
    return state;
  }
}

function editConnection(state, action) {
  const payload = action.payload || {};
  const editId = payload.id;

  const connectionObjs = state.connections || [];
  const connectionsById = _.keyBy(connectionObjs, 'id');
  const connectionToEdit = connectionsById[editId];
  const connectionSettings = connectionToEdit ? connectionToEdit.getSettings() : {};

  const newState = { ...state };
  newState.connectionSettingsToEdit = {
    id: editId,
    ...connectionSettings,
  };

  return newState;
}

function cancelEditConnection(state) {
  const newState = { ...state };
  newState.connectionSettingsToEdit = null;
  return newState;
}

function saveConnection(state, action) {
  const payload = action.payload || {};
  const index = payload.id;
  const settings = payload.settings;

  const newState = { ...state };
  const connectionObjs = state.connections || [];
  const connectionsById = _.keyBy(connectionObjs, 'id');
  const connectionToEdit = connectionsById[index];

  if (connectionToEdit) {
    connectionToEdit.editSettings(settings);
  } else {
    const newConnection = new ConsoleConnection(settings);
    connectionsById[newConnection.id] = newConnection;
  }

  const resultConnections = _.toArray(connectionsById);
  newState.connections = resultConnections;
  newState.connectionSettingsToEdit = null; // Close modal

  storeConnections(resultConnections);

  return newState;
}

function storeConnections(connectionObjs) {
  electronSettings.set(connectionPath, _.map(connectionObjs, (connection) => (
    connection.getSettings()
  )));
}

function deleteConnection(state) {
  return state;
}

function connectConnection(state) {
  return state;
}
