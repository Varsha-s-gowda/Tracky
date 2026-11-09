const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const authMiddleware = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required. Please sign in.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
    throw new ApiError(401, 'Invalid authentication token.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'The account for this session no longer exists.');
  }

  req.user = user;
  req.tokenExpiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
  return next();
});

module.exports = authMiddleware;
