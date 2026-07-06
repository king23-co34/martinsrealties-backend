const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const logger = require('../config/logger');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: (Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000,
});

// @desc    Register a new user (role defaults to 'user')
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({ name, email, password, phone });
  const token = generateToken(user._id, user.role);

  logger.info(`New user registered: ${user.email}`);

  res.cookie('token', token, cookieOptions());
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    data: { user: user.toSafeObject() },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated. Contact support.', 403));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  logger.info(`User logged in: ${user.email}`);

  res.cookie('token', token, cookieOptions());
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    data: { user: user.toSafeObject() },
  });
});

// @desc    Logout user (clears cookie)
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get currently logged in user's profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

// @desc    Update own profile (name/phone only)
// @route   PATCH /api/v1/auth/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: { user: user.toSafeObject() } });
});

// @desc    Update own password
// @route   PATCH /api/v1/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id, user.role);
  res.cookie('token', token, cookieOptions());
  res.status(200).json({ success: true, message: 'Password updated successfully', token });
});
