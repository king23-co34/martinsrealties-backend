const { body } = require('express-validator');

const allowedTypes = ['apartment', 'house', 'duplex', 'bungalow', 'land', 'office', 'shortlet', 'other'];
const allowedListingTypes = ['sale', 'rent', 'shortlet'];
const allowedStatuses = ['available', 'pending', 'sold', 'rented'];

exports.createPropertyValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').isIn(allowedTypes).withMessage(`Type must be one of: ${allowedTypes.join(', ')}`),
  body('listingType')
    .isIn(allowedListingTypes)
    .withMessage(`Listing type must be one of: ${allowedListingTypes.join(', ')}`),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
];

exports.updatePropertyValidator = [
  body('type').optional().isIn(allowedTypes).withMessage(`Type must be one of: ${allowedTypes.join(', ')}`),
  body('listingType')
    .optional()
    .isIn(allowedListingTypes)
    .withMessage(`Listing type must be one of: ${allowedListingTypes.join(', ')}`),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('status').optional().isIn(allowedStatuses).withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),
];
