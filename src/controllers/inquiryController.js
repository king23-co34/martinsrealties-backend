const Inquiry = require('../models/Inquiry');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

// @desc    Submit a new inquiry / contact message
// @route   POST /api/v1/inquiries
// @access  Public (attaches user if logged in via optionalAuth)
exports.createInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, property } = req.body;

  const inquiry = await Inquiry.create({
    name,
    email,
    phone,
    subject,
    message,
    property: property || null,
    user: req.user ? req.user._id : null,
  });

  logger.info(`New inquiry received from ${email}`);

  res.status(201).json({
    success: true,
    message: 'Your inquiry has been submitted. Our team will get back to you shortly.',
    data: { inquiry },
  });
});

// @desc    Get all inquiries (filter by status, paginated)
// @route   GET /api/v1/inquiries
// @access  Private/Admin
exports.getInquiries = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(
    Inquiry.find().populate('property', 'title city state').populate('user', 'name email'),
    req.query
  )
    .filter()
    .sort()
    .paginate();

  const [inquiries, total] = await Promise.all([
    features.query,
    Inquiry.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    count: inquiries.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: { inquiries },
  });
});

// @desc    Get a single inquiry
// @route   GET /api/v1/inquiries/:id
// @access  Private/Admin
exports.getInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('property', 'title city state')
    .populate('user', 'name email');

  if (!inquiry) return next(new AppError('Inquiry not found.', 404));
  res.status(200).json({ success: true, data: { inquiry } });
});

// @desc    Update inquiry status / admin note
// @route   PATCH /api/v1/inquiries/:id
// @access  Private/Admin
exports.updateInquiry = asyncHandler(async (req, res, next) => {
  const { status, adminNote } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (adminNote !== undefined) updates.adminNote = adminNote;

  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!inquiry) return next(new AppError('Inquiry not found.', 404));
  res.status(200).json({ success: true, data: { inquiry } });
});

// @desc    Delete an inquiry
// @route   DELETE /api/v1/inquiries/:id
// @access  Private/Admin
exports.deleteInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) return next(new AppError('Inquiry not found.', 404));
  res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
});
