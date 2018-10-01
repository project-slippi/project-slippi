import {
  CONNECTION_CANCEL_EDIT, CONNECTION_EDIT, CONNECTION_SAVE, CONNECTION_DELETE, CONNECTION_CONNECT,
} from '../actions/console';

const _ = require('lodash');
const electronSettings = require('electron-settings');

const connectionPath = "connections";

const defaultState = {
  connections: getStoredConnections(),
  connectionToEdit: null,
};

function getStoredConnections() {
  return electronSettings.get(connectionPath) || [];
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

  const list = state.connections || [];
  const connectionToEdit = list[editId] || {};

  const newState = { ...state };
  newState.connectionToEdit = {
    ...connectionToEdit,
    index: editId,
  };

  return newState;
}

function cancelEditConnection(state) {
  const newState = { ...state };
  newState.connectionToEdit = null;
  return newState;
}

function saveConnection(state, action) {
  const payload = action.payload || {};
  const index = payload.id;
  const settings = payload.settings;

  const newState = { ...state };
  const list = newState.connections || [];

  if (index === "new") {
    list.push(settings);
  } else if (parseInt(index, 10)) {
    list[index] = settings;
  }

  newState.connections = list;
  newState.connectionToEdit = null; // Close modal
  return newState;
}

function deleteConnection(state) {
  return state;
}

function connectConnection(state) {
  return state;
}
