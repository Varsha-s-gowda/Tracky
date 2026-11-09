const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const {
  requiredString,
  validEmail,
  validPassword,
  validTimezone,
  optionalString,
} = require('../utils/validation');
const { signToken, createResetToken, hashResetToken } = require('../services/tokenService');

function assertProfileImage(value) {
  const image = optionalString(value, 'Profile image URL', { max: 500 });
  if (!image) return '';

  let parsed;
  try {
    parsed = new URL(image);
  } catch {
    throw new ApiError(400, 'Profile image must be a valid URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ApiError(400, 'Profile image must use an http or https URL.');
  }

  return image;
}

const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = requiredString(body.name, 'Full name', { min: 2, max: 60 });
  const email = validEmail(body.email);
  const password = validPassword(body.password);
  const timezone = validTimezone(body.timezone);

  if (body.confirmPassword !== undefined && body.confirmPassword !== password) {
    throw new ApiError(400, 'Passwords do not match.');
  }

  const existing = await User.exists({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, password, timezone });
  const token = signToken(user._id, true);

  res.status(201).json({ token, user });
});

const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = validEmail(body.email);

  if (typeof body.password !== 'string' || !body.password) {
    throw new ApiError(400, 'Password is required.');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatches = await user.comparePassword(body.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = signToken(user._id, body.remember === true);
  const safeUser = user.toJSON();

  res.json({ token, user: safeUser });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (body.name !== undefined) {
    user.name = requiredString(body.name, 'Full name', { min: 2, max: 60 });
  }

  if (body.timezone !== undefined) {
    user.timezone = validTimezone(body.timezone);
  }

  if (body.profileImage !== undefined) {
    user.profileImage = assertProfileImage(body.profileImage);
  }

  await user.save();
  res.json({ user });
});

const changePassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
    throw new ApiError(400, 'Current password is required.');
  }

  const newPassword = validPassword(body.newPassword);
  if (body.confirmPassword !== undefined && body.confirmPassword !== newPassword) {
    throw new ApiError(400, 'New passwords do not match.');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const matches = await user.comparePassword(body.currentPassword);
  if (!matches) {
    throw new ApiError(400, 'Current password is incorrect.');
  }

  if (body.currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from your current password.');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = validEmail(body.email);
  const user = await User.findOne({ email });

  let devResetToken;
  if (user) {
    const { rawToken, tokenHash } = createResetToken();
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    devResetToken = rawToken;
  }

  // The response is intentionally identical whether or not the account exists.
  res.json({
    message: 'If an account exists for that email, a password reset link has been created.',
    ...(env.nodeEnv !== 'production' && devResetToken ? { devResetToken } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const rawToken = req.params.token;
  if (typeof rawToken !== 'string' || !/^[a-f0-9]{64}$/i.test(rawToken)) {
    throw new ApiError(400, 'This password reset link is invalid.');
  }

  const newPassword = validPassword((req.body || {}).newPassword);
  if ((req.body || {}).confirmPassword !== undefined && (req.body || {}).confirmPassword !== newPassword) {
    throw new ApiError(400, 'Passwords do not match.');
  }

  const tokenHash = hashResetToken(rawToken);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordTokenHash +resetPasswordExpires');

  if (!user) {
    throw new ApiError(400, 'This password reset link is invalid or has expired.');
  }

  user.password = newPassword;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Your password has been reset. You can now sign in.' });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
