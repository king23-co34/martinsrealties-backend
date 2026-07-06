// One-off script to create the first admin account.
// Run with: npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.ADMIN_EMAIL;
    const existing = await User.findOne({ email });

    if (existing) {
      logger.info(`Admin already exists: ${email}`);
    } else {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      });
      logger.info(`Admin account created: ${email}`);
    }
  } catch (error) {
    logger.error(`Seeding admin failed: ${error.message}`);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
