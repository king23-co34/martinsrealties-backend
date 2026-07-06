const AppError = require('../utils/appError');

// Usage: authorize('admin') or authorize('admin', 'user')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = authorize;
