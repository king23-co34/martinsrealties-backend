const User = require('../models/User');
const logger = require('../config/logger');

// Runs automatically on every server startup (see server.js).
//
// Root cause this fixes: previously the ONLY way to create the admin
// account was to manually run `npm run seed:admin`. Simply setting
// ADMIN_EMAIL / ADMIN_PASSWORD in Render's environment variables never
// created anything in MongoDB by itself, so logging in with those
// credentials always failed with "Invalid email or password" because
// no matching user document existed yet.
//
// This function is idempotent: if an admin with ADMIN_EMAIL already
// exists it does nothing (and, if ADMIN_PASSWORD was changed in the
// environment, it resets the stored password to match so the env vars
// are always the source of truth). It never throws — a failure here
// must never crash server startup.
const ensureAdminSeeded = async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      logger.info('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin auto-seed.');
      return;
    }

    if (password.length < 8) {
      logger.error('ADMIN_PASSWORD must be at least 8 characters — skipping admin auto-seed.');
      return;
    }

    const existing = await User.findOne({ email }).select('+password');

    if (!existing) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email,
        password,
        role: 'admin',
      });
      logger.info(`Admin account created automatically on startup: ${email}`);
      return;
    }

    // Keep the account in sync with env vars: make sure it's still an
    // active admin, and reset the password if it no longer matches
    // ADMIN_PASSWORD (covers the case where the env var was changed
    // on Render but the DB still has the old password).
    let needsSave = false;

    if (existing.role !== 'admin') {
      existing.role = 'admin';
      needsSave = true;
    }
    if (!existing.isActive) {
      existing.isActive = true;
      needsSave = true;
    }

    const passwordMatches = await existing.comparePassword(password);
    if (!passwordMatches) {
      existing.password = password;
      needsSave = true;
    }

    if (needsSave) {
      await existing.save({ validateBeforeSave: false });
      logger.info(`Admin account synced with environment variables: ${email}`);
    } else {
      logger.info(`Admin account already up to date: ${email}`);
    }
  } catch (error) {
    logger.error(`Admin auto-seed failed: ${error.message}`);
  }
};

module.exports = ensureAdminSeeded;
