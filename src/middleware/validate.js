const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

// Runs after express-validator chains; collects errors into a single AppError
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const messages = errors.array().map((err) => err.msg);
  return next(new AppError(messages.join('. '), 400));
};

module.exports = validate;
