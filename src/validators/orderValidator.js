const { body } = require('express-validator');

exports.checkoutValidator = [
  body('contactPhone').trim().notEmpty().withMessage('Contact phone is required'),
  body('contactAddress').trim().notEmpty().withMessage('Contact/delivery address is required'),
  body('notes').optional().trim(),
];

exports.updateOrderValidator = [
  body('status')
    .optional()
    .isIn(['pending', 'reviewing', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid order status'),
  body('paymentStatus')
    .optional()
    .isIn(['unpaid', 'paid', 'refunded'])
    .withMessage('Invalid payment status'),
  body('adminNote').optional().trim(),
];
