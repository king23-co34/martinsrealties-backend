require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const ensureAdminSeeded = require('./src/utils/ensureAdminSeeded');

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Make sure the admin account from ADMIN_EMAIL/ADMIN_PASSWORD always
  // exists in the database. Previously this required manually running
  // `npm run seed:admin`; now it happens automatically on every boot.
  await ensureAdminSeeded();

  const server = app.listen(PORT, () => {
    logger.info(`Martins Realties API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    server.close(() => logger.info('Process terminated.'));
  });
});
