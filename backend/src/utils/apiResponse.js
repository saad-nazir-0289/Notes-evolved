export const successResponse = (message, data = null) => ({
  success: true,
  message,
  data,
});

export const failureResponse = (message) => ({
  success: false,
  message,
  data: null,
});
