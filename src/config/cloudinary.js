const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

// Fail loudly at boot instead of letting every image upload crash later with
// a confusing "Invalid cloud_name" error. The cloud_name must match exactly
// what's shown at the top of the Cloudinary dashboard (cloudinary.com/console) -
// it is NOT something you choose yourself, it's auto-generated per account.
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  logger.error(
    'Cloudinary is misconfigured: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and ' +
      'CLOUDINARY_API_SECRET must all be set in the environment. Check Render > ' +
      'Environment and compare against your Cloudinary dashboard (cloudinary.com/console).'
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
