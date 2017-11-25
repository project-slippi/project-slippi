export const GAME_PROFILE_LOAD = 'GAME_PROFILE_LOAD';

export function gameProfileLoad(game) {
  return (dispatch) => {
    // Load game information asynchronously
    dispatch({
      type: GAME_PROFILE_LOAD,
      game: game
    });
  };
}
