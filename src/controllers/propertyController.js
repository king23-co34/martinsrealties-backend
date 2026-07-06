const Property = require('../models/Property');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');

// @desc    Get all properties with search/filter/sort/pagination
// @route   GET /api/v1/properties
// @access  Public
// Supported query params:
//   q=search text -> searches title, description, city, state
//   type, listingType, status, city, state -> exact filters
//   price[gte]=, price[lte]= -> range filters
//   bedrooms, bathrooms -> exact filters
//   sort=price,-createdAt
//   fields=title,price,city
//   page=1&limit=12
exports.getProperties = asyncHandler(async (req, res) => {
  const baseQuery = Property.find();
  const features = new ApiFeatures(baseQuery, req.query)
    .search(['title', 'description', 'city', 'state'])
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [properties, total] = await Promise.all([
    features.query,
    Property.countDocuments(features.query.getFilter()),
  ]);

  res.status(200).json({
    success: true,
    count: properties.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: { properties },
  });
});

// @desc    Get a single property by ID (increments view count)
// @route   GET /api/v1/properties/:id
// @access  Public
exports.getProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('createdBy', 'name email');

  if (!property) return next(new AppError('Property not found.', 404));

  res.status(200).json({ success: true, data: { property } });
});

// @desc    Create a new property (with optional image uploads)
// @route   POST /api/v1/properties
// @access  Private/Admin
exports.createProperty = asyncHandler(async (req, res) => {
  const images = (req.files || []).map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));

  const property = await Property.create({
    ...req.body,
    amenities: req.body.amenities
      ? req.body.amenities.split(',').map((a) => a.trim())
      : [],
    images,
    createdBy: req.user._id,
  });

  logger.info(`Property created: ${property.title} by ${req.user.email}`);

  res.status(201).json({ success: true, data: { property } });
});

// @desc    Update a property (fields and/or add new images)
// @route   PATCH /api/v1/properties/:id
// @access  Private/Admin
exports.updateProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  if (!property) return next(new AppError('Property not found.', 404));

  const updates = { ...req.body };
  if (req.body.amenities) {
    updates.amenities = req.body.amenities.split(',').map((a) => a.trim());
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({ url: file.path, publicId: file.filename }));
    updates.images = [...property.images, ...newImages];
  }

  const updated = await Property.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: { property: updated } });
});

// @desc    Delete a specific image from a property
// @route   DELETE /api/v1/properties/:id/images/:publicId
// @access  Private/Admin
exports.deletePropertyImage = asyncHandler(async (req, res, next) => {
  const { id, publicId } = req.params;
  const property = await Property.findById(id);
  if (!property) return next(new AppError('Property not found.', 404));

  const decodedPublicId = decodeURIComponent(publicId);

  try {
    await cloudinary.uploader.destroy(decodedPublicId);
  } catch (err) {
    logger.error(`Cloudinary deletion failed for ${decodedPublicId}: ${err.message}`);
  }

  property.images = property.images.filter((img) => img.publicId !== decodedPublicId);
  await property.save();

  res.status(200).json({ success: true, data: { property } });
});

// @desc    Delete a property (and its cloudinary images)
// @route   DELETE /api/v1/properties/:id
// @access  Private/Admin
exports.deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  if (!property) return next(new AppError('Property not found.', 404));

  await Promise.all(
    property.images.map((img) =>
      cloudinary.uploader.destroy(img.publicId).catch((err) => {
        logger.error(`Cloudinary deletion failed for ${img.publicId}: ${err.message}`);
      })
    )
  );

  await property.deleteOne();

  logger.info(`Property deleted: ${property.title} by ${req.user.email}`);
  res.status(200).json({ success: true, message: 'Property deleted successfully' });
});

// @desc    Get featured properties (for homepage)
// @route   GET /api/v1/properties/featured
// @access  Public
exports.getFeaturedProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ featured: true, status: 'available' })
    .sort('-createdAt')
    .limit(8);

  res.status(200).json({ success: true, count: properties.length, data: { properties } });
});
