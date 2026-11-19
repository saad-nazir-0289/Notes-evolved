export const successResponse = (message, data = null, meta = null) => ({
  success: true,
  message,
  data,
  ...(meta ? { meta } : {}),
});

export const failureResponse = (message) => ({
  success: false,
  message,
  data: null,
});
