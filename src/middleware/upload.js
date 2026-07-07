const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/appError');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'martins-realties/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1600, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const hasImageMimetype = file.mimetype.startsWith('image/');
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
    file.originalname.toLowerCase().endsWith(ext)
  );

  // Some browsers (especially on older mobile devices) send a generic
  // mimetype like "application/octet-stream" instead of "image/...".
  // Falling back to the file extension avoids rejecting valid photos.
  if (hasImageMimetype || hasAllowedExtension) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpg, jpeg, png, webp)', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per file, max 10 files
});

module.exports = upload;
