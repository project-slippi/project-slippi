import { GAME_PROFILE_LOAD } from '../actions/game';

// Default state for this reducer
const defaultState = {
  path: "",
  stats: {}
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

  const slpGame = action.game;
  const settings = slpGame.getSettings();
  console.log(settings.stageId);

  return newState;
}
