const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(userId, remember = false) {
  return jwt.sign({ sub: userId.toString() }, env.jwtSecret, {
    expiresIn: remember ? env.jwtRememberExpiresIn : env.jwtExpiresIn,
  });
}

function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { signToken, createResetToken, hashResetToken };
