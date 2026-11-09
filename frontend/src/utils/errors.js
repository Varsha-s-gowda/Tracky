export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  const message = error.response?.data?.message || error.message;
  if (!message) return fallback;
  if (error.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Check that the Tracky AI API is running.';
  }
  return message;
}
