const { body } = require('express-validator');

exports.createInquiryValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  body('property').optional().isMongoId().withMessage('Invalid property reference'),
];

exports.updateInquiryValidator = [
  body('status')
    .optional()
    .isIn(['new', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status value'),
  body('adminNote').optional().trim(),
];
