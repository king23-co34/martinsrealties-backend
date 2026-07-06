const express = require('express');
const inquiryController = require('../controllers/inquiryController');
const { protect, optionalAuth } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const {
  createInquiryValidator,
  updateInquiryValidator,
} = require('../validators/inquiryValidator');

const router = express.Router();

router.post('/', optionalAuth, createInquiryValidator, validate, inquiryController.createInquiry);

router.get('/', protect, authorize('admin'), inquiryController.getInquiries);
router.get('/:id', protect, authorize('admin'), inquiryController.getInquiry);
router.patch(
  '/:id',
  protect,
  authorize('admin'),
  updateInquiryValidator,
  validate,
  inquiryController.updateInquiry
);
router.delete('/:id', protect, authorize('admin'), inquiryController.deleteInquiry);

module.exports = router;
