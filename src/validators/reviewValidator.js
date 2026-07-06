const { body } = require('express-validator');

exports.createReviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1000 }),
  body('property').optional().isMongoId().withMessage('Invalid property reference'),
];
