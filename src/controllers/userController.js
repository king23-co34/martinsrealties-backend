const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(User.find(), req.query).filter().sort().paginate();
  const [users, total] = await Promise.all([features.query, User.countDocuments()]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: { users },
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: { user } });
});

// @desc    Update a user's role or active status
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { role, isActive } = req.body;
  const updates = {};
  if (role) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: { user } });
});

// @desc    Delete a user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});
