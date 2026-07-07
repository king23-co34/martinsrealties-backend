const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/%DATE%-combined.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '20m',
});

const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  maxSize: '20m',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports: [
    fileRotateTransport,
    errorFileRotateTransport,
  ],
  exitOnError: false,
});

// Always log to console as well as to file. Platforms like Render capture
// stdout/stderr for their log viewer, but the on-disk log files above live
// on ephemeral storage that isn't visible there — without this, production
// logs (e.g. admin auto-seed status, login attempts) were effectively
// invisible on Render.
logger.add(
  new winston.transports.Console({
    format: combine(colorize(), timestamp(), logFormat),
  })
);

module.exports = logger;
