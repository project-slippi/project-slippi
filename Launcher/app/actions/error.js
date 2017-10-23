export const DISPLAY_ERROR = 'DISPLAY_ERROR';
export const DISMISS_ERROR = 'DISMISS_ERROR';

export function displayError(key, message) {
  return {
    type: DISPLAY_ERROR,
    key: key,
    errorMessage: message
  };
}

export function dismissError(key) {
  return {
    type: DISMISS_ERROR,
    key: key
  };
}
