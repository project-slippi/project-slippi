import { GAME_PROFILE_LOAD } from '../actions/game';

// Default state for this reducer
const defaultState = {
  game: null
};

export default function game(state = defaultState, action) {
  switch (action.type) {
  case GAME_PROFILE_LOAD:
    return loadGame(state, action);
  default:
    return state;
  }
}

function loadGame(state, action) {
  const newState = { ...state };

  const slpGame = action.game || {};

  // Generate data here so that maybe we can add a loading state
  slpGame.getSettings();
  slpGame.getStats();
  slpGame.getMetadata();

  // Add slippi game to state
  newState.game = slpGame;

  return newState;
}
