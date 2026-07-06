const Review = require('../models/Review');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get approved reviews (for homepage display)
// @route   GET /api/v1/reviews
// @access  Public
exports.getApprovedReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  const reviews = await Review.find({ isApproved: true })
    .populate('user', 'name')
    .populate('property', 'title city')
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json({ success: true, count: reviews.length, data: { reviews } });
});

// @desc    Get all reviews including pending (moderation queue)
// @route   GET /api/v1/reviews/admin
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === 'pending') filter.isApproved = false;
  if (req.query.status === 'approved') filter.isApproved = true;

  const reviews = await Review.find(filter)
    .populate('user', 'name email')
    .populate('property', 'title city')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: reviews.length, data: { reviews } });
});

// @desc    Submit a review
// @route   POST /api/v1/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
  const { rating, comment, property } = req.body;

  const review = await Review.create({
    user: req.user._id,
    property: property || null,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    message: 'Thank you! Your review has been submitted and is pending approval.',
    data: { review },
  });
});

// @desc    Approve or reject a review
// @route   PATCH /api/v1/reviews/:id
// @access  Private/Admin
exports.moderateReview = asyncHandler(async (req, res, next) => {
  const { isApproved } = req.body;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: !!isApproved },
    { new: true, runValidators: true }
  );

  if (!review) return next(new AppError('Review not found.', 404));
  res.status(200).json({ success: true, data: { review } });
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));
  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});
