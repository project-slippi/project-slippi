export const GAME_PROFILE_LOAD = 'GAME_PROFILE_LOAD';

export function gameProfileLoad(path) {
  return (dispatch) => {
    // Load game information asynchronously
    dispatch({
      type: GAME_PROFILE_LOAD,
      path: path
    });
  };
}
