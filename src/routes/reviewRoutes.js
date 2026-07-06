const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { createReviewValidator } = require('../validators/reviewValidator');

const router = express.Router();

// Public - approved reviews shown on homepage
router.get('/', reviewController.getApprovedReviews);

router.get('/admin', protect, authorize('admin'), reviewController.getAllReviews);
router.post('/', protect, createReviewValidator, validate, reviewController.createReview);
router.patch('/:id', protect, authorize('admin'), reviewController.moderateReview);
router.delete('/:id', protect, authorize('admin'), reviewController.deleteReview);

module.exports = router;
