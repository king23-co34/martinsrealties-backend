const AppError = require('../utils/appError');
const logger = require('../config/logger');

const handleCastErrorDB = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = field ? err.keyValue[field] : '';
  return new AppError(`Duplicate value for '${field}': '${value}'. Please use another value.`, 409);
};

const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(messages.join('. '), 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your session has expired. Please log in again.', 401);

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') return new AppError('File too large. Max size is 5MB per image.', 400);
  if (err.code === 'LIMIT_FILE_COUNT') return new AppError('Too many files. Max 10 images allowed.', 400);
  return new AppError(err.message || 'File upload error.', 400);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, {
    stack: err.stack,
  });

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name === 'MulterError') error = handleMulterError(err);

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';
  const isOperational = error.isOperational || false;

  res.status(statusCode).json({
    success: false,
    status,
    message: isOperational ? error.message : 'Something went wrong on the server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
