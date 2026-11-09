const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'The provided identifier is invalid.';
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0];
    if (field === 'email') {
      message = 'An account with this email already exists.';
    } else if (error.keyPattern?.habitId || error.keyPattern?.date) {
      message = 'This habit has already been logged for that date.';
    } else {
      message = 'A record with these details already exists.';
    }
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'The request body contains invalid JSON.';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  if (env.nodeEnv !== 'production' && statusCode >= 500) {
    details = details || error.stack;
  }

  res.status(statusCode).json({
    message,
    ...(details ? { details } : {}),
  });
};

module.exports = { notFound, errorHandler };
